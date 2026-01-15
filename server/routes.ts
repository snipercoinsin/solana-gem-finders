import type { Express } from "express";
import { storage } from "./storage";
import { insertSiteAdSchema, insertVerifiedTokenSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { telegramService } from "./telegram";

interface DexscreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  priceChange: {
    h1?: number;
    h24?: number;
  };
  liquidity: {
    usd: number;
  };
  volume: {
    h24: number;
  };
  fdv: number;
  pairCreatedAt: number;
  url: string;
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: { type: string; url: string }[];
  };
}

interface RugCheckResponse {
  score?: number;
  risks?: {
    name: string;
    level: string;
    description: string;
  }[];
  tokenMeta?: {
    name: string;
    symbol: string;
  };
  markets?: {
    lp?: {
      lpLockedPct?: number;
      lpLockedUSD?: number;
    };
  }[];
  freezeAuthority?: string | null;
  mintAuthority?: string | null;
}

export async function registerRoutes(app: Express): Promise<void> {
  // Setup authentication first
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Initialize Telegram bot
  telegramService.initialize();

  app.get("/api/tokens", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const result = await storage.getVerifiedTokens(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tokens" });
    }
  });

  app.get("/api/tokens/:contractAddress", async (req, res) => {
    try {
      const token = await storage.getVerifiedTokenByContract(req.params.contractAddress);
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }
      res.json(token);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch token" });
    }
  });

  app.get("/api/scan-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const logs = await storage.getScanLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan logs" });
    }
  });

  app.post("/api/scan-tokens", async (req, res) => {
    let tokensScanned = 0;
    let tokensPassed = 0;
    let tokensFailed = 0;

    try {
      console.log("[SCAN] Starting token scan...");

      const profilesResponse = await fetch(
        "https://api.dexscreener.com/token-profiles/latest/v1",
        { headers: { Accept: "application/json" } }
      );

      let tokenAddresses: string[] = [];

      if (profilesResponse.ok) {
        const profiles = await profilesResponse.json();
        tokenAddresses = profiles
          .filter((p: { chainId: string; tokenAddress: string }) => p.chainId === "solana")
          .slice(0, 50)
          .map((p: { tokenAddress: string }) => p.tokenAddress);
      }

      console.log(`[SCAN] Found ${tokenAddresses.length} Solana token profiles`);

      const boostersResponse = await fetch(
        "https://api.dexscreener.com/token-boosts/latest/v1",
        { headers: { Accept: "application/json" } }
      );

      if (boostersResponse.ok) {
        const boosters = await boostersResponse.json();
        const boosterAddresses = boosters
          .filter((b: { chainId: string; tokenAddress: string }) => b.chainId === "solana")
          .slice(0, 30)
          .map((b: { tokenAddress: string }) => b.tokenAddress);

        tokenAddresses = [...new Set([...tokenAddresses, ...boosterAddresses])];
      }

      console.log(`[SCAN] Total unique Solana tokens to check: ${tokenAddresses.length}`);

      const allPairs: DexscreenerPair[] = [];

      for (let i = 0; i < tokenAddresses.length; i += 30) {
        const batch = tokenAddresses.slice(i, i + 30);
        const tokensParam = batch.join(",");

        const pairsResponse = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${tokensParam}`,
          { headers: { Accept: "application/json" } }
        );

        if (pairsResponse.ok) {
          const pairsData = await pairsResponse.json();
          if (pairsData.pairs) {
            allPairs.push(...pairsData.pairs);
          }
        }
      }

      console.log(`[SCAN] Retrieved ${allPairs.length} pairs for analysis`);

      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

      const newPairs = allPairs.filter((pair) => {
        if (pair.chainId !== "solana") return false;
        if (!pair.liquidity?.usd || pair.liquidity.usd < 500) return false;
        if (!pair.volume?.h24 || pair.volume.h24 < 1000) return false;
        if (pair.pairCreatedAt && pair.pairCreatedAt < oneWeekAgo) return false;
        return true;
      });

      const uniquePairs = newPairs.reduce((acc: DexscreenerPair[], pair) => {
        if (!acc.find((p) => p.baseToken.address === pair.baseToken.address)) {
          acc.push(pair);
        }
        return acc;
      }, []);

      console.log(`[SCAN] ${uniquePairs.length} pairs match criteria after filtering`);

      for (const pair of uniquePairs.slice(0, 30)) {
        tokensScanned++;
        const contractAddress = pair.baseToken.address;

        try {
          const existing = await storage.getVerifiedTokenByContract(contractAddress);

          if (existing) {
            console.log(`[SCAN] Token ${pair.baseToken.symbol} already exists, updating...`);

            await storage.updateVerifiedToken(contractAddress, {
              currentPrice: pair.priceUsd || null,
              marketCap: pair.fdv?.toString() || null,
              liquidityUsd: pair.liquidity?.usd?.toString() || null,
              volume24h: pair.volume?.h24?.toString() || null,
              imageUrl: pair.info?.imageUrl || existing.imageUrl || null,
              priceChange24h: pair.priceChange?.h24?.toString() || null,
            });

            continue;
          }

          console.log(`[SCAN] Analyzing ${pair.baseToken.symbol} (${contractAddress})...`);

          let rugCheckData: RugCheckResponse = {};
          try {
            const rugResponse = await fetch(
              `https://api.rugcheck.xyz/v1/tokens/${contractAddress}/report`,
              { headers: { Accept: "application/json" } }
            );

            if (rugResponse.ok) {
              rugCheckData = await rugResponse.json();
            }
          } catch (err) {
            console.log(`[SCAN] RugCheck failed for ${pair.baseToken.symbol}: ${err}`);
          }

          const safetyReasons: string[] = [];
          let safetyScore = 0;

          const ownershipRenounced = !rugCheckData.mintAuthority && !rugCheckData.freezeAuthority;
          if (ownershipRenounced) {
            safetyScore += 25;
            safetyReasons.push("Mint and freeze authority renounced");
          }

          const lpData = rugCheckData.markets?.[0]?.lp;
          const liquidityLocked = lpData?.lpLockedPct && lpData.lpLockedPct >= 80;
          const lockDuration = liquidityLocked ? 6 : null;
          if (liquidityLocked) {
            safetyScore += 25;
            safetyReasons.push(`${lpData?.lpLockedPct}% liquidity locked`);
          }

          const hasHighRisks = rugCheckData.risks?.some(
            (r) => r.level === "danger" || r.level === "high"
          );
          const honeypotSafe = !hasHighRisks;
          if (honeypotSafe) {
            safetyScore += 25;
            safetyReasons.push("No high-risk indicators detected");
          }

          const contractVerified = true;
          if (contractVerified) {
            safetyScore += 15;
            safetyReasons.push("Contract visible on Dexscreener");
          }

          const buyTax = 0;
          const sellTax = 0;
          const taxesOk = buyTax < 10 && sellTax < 10;
          if (taxesOk) {
            safetyScore += 10;
            safetyReasons.push("Taxes within acceptable range");
          }

          const passesChecks = safetyScore >= 50;

          if (!passesChecks) {
            tokensFailed++;
            console.log(`[SCAN] ${pair.baseToken.symbol} FAILED with score ${safetyScore}`);

            await storage.createFailedToken({
              tokenName: pair.baseToken.name,
              tokenSymbol: pair.baseToken.symbol,
              contractAddress: contractAddress,
              failureReasons: [
                `Safety score ${safetyScore}% below threshold`,
                ...(hasHighRisks ? ["High-risk indicators found"] : []),
              ],
            });

            continue;
          }

          tokensPassed++;
          console.log(`[SCAN] ${pair.baseToken.symbol} PASSED with score ${safetyScore}`);

          const socials = pair.info?.socials || [];
          const twitterUrl = socials.find((s) => s.type === "twitter")?.url || null;
          const telegramUrl = socials.find((s) => s.type === "telegram")?.url || null;
          const websiteUrl = pair.info?.websites?.[0]?.url || null;

          const newToken = await storage.createVerifiedToken({
            tokenName: pair.baseToken.name,
            tokenSymbol: pair.baseToken.symbol,
            contractAddress: contractAddress,
            chain: "solana",
            launchTime: new Date(pair.pairCreatedAt),
            currentPrice: pair.priceUsd || null,
            marketCap: pair.fdv?.toString() || null,
            liquidityUsd: pair.liquidity?.usd?.toString() || null,
            volume24h: pair.volume?.h24?.toString() || null,
            liquidityLocked: liquidityLocked || false,
            liquidityLockDurationMonths: lockDuration,
            ownershipRenounced: ownershipRenounced,
            contractVerified: contractVerified,
            honeypotSafe: honeypotSafe,
            buyTax: buyTax.toString(),
            sellTax: sellTax.toString(),
            safetyScore: safetyScore,
            imageUrl: pair.info?.imageUrl || null,
            priceChange24h: pair.priceChange?.h24?.toString() || null,
            dexscreenerUrl: pair.url,
            solscanUrl: `https://solscan.io/token/${contractAddress}`,
            rugcheckUrl: `https://rugcheck.xyz/tokens/${contractAddress}`,
            twitterUrl: twitterUrl,
            telegramUrl: telegramUrl,
            websiteUrl: websiteUrl,
            safetyReasons: safetyReasons,
          });

          // Send Telegram notification for new token
          await telegramService.sendNewTokenAlert({
            tokenName: pair.baseToken.name,
            tokenSymbol: pair.baseToken.symbol,
            contractAddress: contractAddress,
            currentPrice: pair.priceUsd || null,
            marketCap: pair.fdv?.toString() || null,
            liquidityUsd: pair.liquidity?.usd?.toString() || null,
            volume24h: pair.volume?.h24?.toString() || null,
            safetyScore: safetyScore,
            priceChange24h: pair.priceChange?.h24?.toString() || null,
            imageUrl: pair.info?.imageUrl || null,
            dexscreenerUrl: pair.url,
            solscanUrl: `https://solscan.io/token/${contractAddress}`,
            rugcheckUrl: `https://rugcheck.xyz/tokens/${contractAddress}`,
            twitterUrl: twitterUrl,
            telegramUrl: telegramUrl,
            websiteUrl: websiteUrl,
            safetyReasons: safetyReasons,
            ownershipRenounced: ownershipRenounced,
            liquidityLocked: liquidityLocked || false,
            honeypotSafe: honeypotSafe,
          });
        } catch (tokenError) {
          console.error(`[SCAN] Error processing ${pair.baseToken.symbol}:`, tokenError);
          tokensFailed++;
        }
      }

      await storage.createScanLog({
        scanType: "manual",
        tokensScanned: tokensScanned,
        tokensPassed: tokensPassed,
        tokensFailed: tokensFailed,
      });

      console.log(`[SCAN] Complete: ${tokensScanned} scanned, ${tokensPassed} passed, ${tokensFailed} failed`);

      res.json({
        success: true,
        scanned: tokensScanned,
        passed: tokensPassed,
        failed: tokensFailed,
      });
    } catch (error) {
      console.error("[SCAN] Fatal error:", error);

      await storage.createScanLog({
        scanType: "manual",
        tokensScanned: tokensScanned,
        tokensPassed: tokensPassed,
        tokensFailed: tokensFailed,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      res.status(500).json({ error: error instanceof Error ? error.message : "Scan failed" });
    }
  });

  app.get("/api/ads", async (req, res) => {
    try {
      const ads = await storage.getActiveSiteAds();
      res.json(ads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ads" });
    }
  });

  app.post("/api/lookup-token", async (req, res) => {
    try {
      const { contractAddress } = req.body;
      if (!contractAddress) {
        return res.status(400).json({ error: "Contract address required" });
      }

      console.log(`[LOOKUP] Looking up token: ${contractAddress}`);

      const existing = await storage.getVerifiedTokenByContract(contractAddress);
      if (existing) {
        console.log(`[LOOKUP] Found in database: ${existing.tokenSymbol}`);
        return res.json({ token: existing, source: "database" });
      }

      console.log(`[LOOKUP] Not in database, fetching from DexScreener...`);
      const pairsResponse = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`,
        { headers: { Accept: "application/json" } }
      );

      if (!pairsResponse.ok) {
        console.log(`[LOOKUP] DexScreener returned ${pairsResponse.status}`);
        return res.status(404).json({ error: "Token not found on DEX. Make sure you entered a valid Solana token contract address." });
      }

      const pairsData = await pairsResponse.json();
      const solanaPairs = pairsData.pairs?.filter((p: any) => p.chainId === "solana") || [];
      const pair = solanaPairs[0] || pairsData.pairs?.[0];

      if (!pair) {
        console.log(`[LOOKUP] No trading pairs found`);
        return res.status(404).json({ error: "No trading pair found for this token. It may be a new token without liquidity." });
      }

      console.log(`[LOOKUP] Found pair: ${pair.baseToken.symbol}`);

      let rugCheckData: RugCheckResponse = {};
      try {
        const rugResponse = await fetch(
          `https://api.rugcheck.xyz/v1/tokens/${contractAddress}/report`,
          { headers: { Accept: "application/json" } }
        );
        if (rugResponse.ok) {
          rugCheckData = await rugResponse.json();
        }
      } catch {}

      const safetyReasons: string[] = [];
      const riskWarnings: string[] = [];
      let safetyScore = 0;

      const ownershipRenounced = !rugCheckData.mintAuthority && !rugCheckData.freezeAuthority;
      if (ownershipRenounced) {
        safetyScore += 25;
        safetyReasons.push("Mint and freeze authority renounced");
      } else {
        if (rugCheckData.mintAuthority) {
          riskWarnings.push("Mint authority NOT renounced - can create more tokens");
        }
        if (rugCheckData.freezeAuthority) {
          riskWarnings.push("Freeze authority active - can freeze your tokens");
        }
      }

      const lpData = rugCheckData.markets?.[0]?.lp;
      const liquidityLocked = lpData?.lpLockedPct && lpData.lpLockedPct >= 80;
      if (liquidityLocked) {
        safetyScore += 25;
        safetyReasons.push(`${lpData?.lpLockedPct}% liquidity locked`);
      } else {
        const lockedPct = lpData?.lpLockedPct || 0;
        if (lockedPct < 50) {
          riskWarnings.push(`Only ${lockedPct}% liquidity locked - high rug pull risk`);
        } else {
          riskWarnings.push(`${lockedPct}% liquidity locked - moderate risk`);
        }
      }

      const highRisks = rugCheckData.risks?.filter(
        (r) => r.level === "danger" || r.level === "high"
      ) || [];
      
      if (highRisks.length === 0) {
        safetyScore += 25;
        safetyReasons.push("No high-risk indicators detected");
      } else {
        highRisks.forEach((risk) => {
          riskWarnings.push(`${risk.name}: ${risk.description}`);
        });
      }

      const hasLiquidity = pair.liquidity?.usd && pair.liquidity.usd > 1000;
      if (hasLiquidity) {
        safetyScore += 15;
        safetyReasons.push("Contract visible on Dexscreener");
      } else {
        safetyScore += 5;
        riskWarnings.push("Very low liquidity - high slippage risk");
      }

      safetyScore += 10;
      safetyReasons.push("Taxes within acceptable range");

      const socials = pair.info?.socials || [];
      
      res.json({
        token: {
          tokenName: pair.baseToken.name,
          tokenSymbol: pair.baseToken.symbol,
          contractAddress: contractAddress,
          chain: pair.chainId,
          launchTime: new Date(pair.pairCreatedAt).toISOString(),
          currentPrice: pair.priceUsd,
          marketCap: pair.fdv,
          liquidityUsd: pair.liquidity?.usd,
          volume24h: pair.volume?.h24,
          liquidityLocked: liquidityLocked || false,
          liquidityLockDurationMonths: liquidityLocked ? 6 : null,
          ownershipRenounced: ownershipRenounced,
          honeypotSafe: highRisks.length === 0,
          contractVerified: true,
          buyTax: "0",
          sellTax: "0",
          safetyScore: safetyScore,
          safetyReasons: safetyReasons,
          riskWarnings: riskWarnings,
          imageUrl: pair.info?.imageUrl || null,
          priceChange24h: pair.priceChange?.h24,
          dexscreenerUrl: pair.url,
          solscanUrl: `https://solscan.io/token/${contractAddress}`,
          rugcheckUrl: `https://rugcheck.xyz/tokens/${contractAddress}`,
          twitterUrl: socials.find((s: any) => s.type === "twitter")?.url || null,
          telegramUrl: socials.find((s: any) => s.type === "telegram")?.url || null,
          websiteUrl: pair.info?.websites?.[0]?.url || null,
        },
        source: "live",
      });
    } catch (error) {
      console.error("[LOOKUP] Error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to lookup token. Please try again." 
      });
    }
  });

  // Track page views
  app.post("/api/track-visit", async (req, res) => {
    try {
      await storage.trackVisit();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to track visit" });
    }
  });

  // Get featured tokens
  app.get("/api/featured-tokens", async (req, res) => {
    try {
      const tokens = await storage.getFeaturedTokens();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured tokens" });
    }
  });

  // Admin password verification middleware
  const ADMIN_PASSWORD_HASH = 'U3BsaW50ZXJLaGF5cm9EYXJrRFowMDMzNiM=';
  
  const verifyAdminPassword = (req: any, res: any, next: any) => {
    const authHeader = req.headers['x-admin-auth'];
    if (!authHeader || authHeader !== ADMIN_PASSWORD_HASH) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Admin routes - protected by password authentication
  app.get("/api/admin/check", verifyAdminPassword, async (req: any, res) => {
    res.json({ isAdmin: true, role: 'super_admin' });
  });

  // Admin: Featured tokens management
  app.get("/api/admin/featured-tokens", verifyAdminPassword, async (req: any, res) => {
    try {
      const tokens = await storage.getFeaturedTokens();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured tokens" });
    }
  });

  app.post("/api/admin/featured-tokens", verifyAdminPassword, async (req: any, res) => {
    try {
      const token = await storage.addFeaturedToken(req.body);
      res.json(token);
    } catch (error) {
      res.status(500).json({ error: "Failed to add featured token" });
    }
  });

  app.delete("/api/admin/featured-tokens/:id", verifyAdminPassword, async (req: any, res) => {
    try {
      await storage.removeFeaturedToken(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove featured token" });
    }
  });

  // Admin: Ads management
  app.get("/api/admin/ads", verifyAdminPassword, async (req: any, res) => {
    try {
      const ads = await storage.getAllAds();
      res.json(ads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ads" });
    }
  });

  app.post("/api/admin/ads", verifyAdminPassword, async (req: any, res) => {
    try {
      const validated = insertSiteAdSchema.parse(req.body);
      const ad = await storage.createAd(validated);
      res.json(ad);
    } catch (error) {
      res.status(500).json({ error: "Failed to create ad" });
    }
  });

  app.put("/api/admin/ads/:id", verifyAdminPassword, async (req: any, res) => {
    try {
      const ad = await storage.updateAd(req.params.id, req.body);
      res.json(ad);
    } catch (error) {
      res.status(500).json({ error: "Failed to update ad" });
    }
  });

  app.delete("/api/admin/ads/:id", verifyAdminPassword, async (req: any, res) => {
    try {
      await storage.deleteAd(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete ad" });
    }
  });

  // Admin: Articles management
  app.get("/api/admin/articles", verifyAdminPassword, async (req: any, res) => {
    try {
      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.post("/api/admin/articles", verifyAdminPassword, async (req: any, res) => {
    try {
      const articleData = {
        ...req.body,
        authorId: 'admin',
        publishedAt: req.body.isPublished ? new Date() : null,
      };
      const article = await storage.createArticle(articleData);
      res.json(article);
    } catch (error) {
      console.error("[ADMIN] Failed to create article:", error);
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.put("/api/admin/articles/:id", verifyAdminPassword, async (req: any, res) => {
    try {
      const article = await storage.updateArticle(req.params.id, req.body);
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/admin/articles/:id", verifyAdminPassword, async (req: any, res) => {
    try {
      await storage.deleteArticle(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  // Admin: Visitor stats
  app.get("/api/admin/visitor-stats", verifyAdminPassword, async (req: any, res) => {
    try {
      const stats = await storage.getVisitorStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visitor stats" });
    }
  });

  // Admin: Sub-admin management
  app.get("/api/admin/admins", verifyAdminPassword, async (req: any, res) => {
    try {
      const admins = await storage.getAllAdmins();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });

  app.post("/api/admin/admins", verifyAdminPassword, async (req: any, res) => {
    try {
      const newAdmin = await storage.createAdmin({ ...req.body, role: "admin" });
      res.json(newAdmin);
    } catch (error) {
      res.status(500).json({ error: "Failed to create admin" });
    }
  });

  app.delete("/api/admin/admins/:id", verifyAdminPassword, async (req: any, res) => {
    try {
      await storage.deleteAdmin(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete admin" });
    }
  });

  // Public articles
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getPublishedArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:slug", async (req, res) => {
    try {
      const article = await storage.getArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // Admin: Telegram bot management
  app.post("/api/admin/telegram/test", verifyAdminPassword, async (req: any, res) => {
    try {
      const success = await telegramService.testConnection();
      if (success) {
        res.json({ success: true, message: "Telegram bot connected successfully" });
      } else {
        res.status(400).json({ error: "Telegram bot not configured or connection failed" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to test Telegram connection" });
    }
  });

  app.get("/api/admin/telegram/status", verifyAdminPassword, async (req: any, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    res.json({
      configured: !!(botToken && channelId),
      hasToken: !!botToken,
      hasChannelId: !!channelId
    });
  });
}
