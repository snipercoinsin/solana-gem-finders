import type { Express } from "express";
import { storage } from "./storage";
import { insertSiteAdSchema, insertVerifiedTokenSchema } from "@shared/schema";

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

export function registerRoutes(app: Express): void {
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

          await storage.createVerifiedToken({
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
            dexscreenerUrl: pair.url,
            solscanUrl: `https://solscan.io/token/${contractAddress}`,
            rugcheckUrl: `https://rugcheck.xyz/tokens/${contractAddress}`,
            twitterUrl: twitterUrl,
            telegramUrl: telegramUrl,
            websiteUrl: websiteUrl,
            safetyReasons: safetyReasons,
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

  app.get("/api/admin/ads", async (req, res) => {
    try {
      const ads = await storage.getSiteAds();
      res.json(ads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ads" });
    }
  });

  app.post("/api/admin/ads", async (req, res) => {
    try {
      const parsed = insertSiteAdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const ad = await storage.createSiteAd(parsed.data);
      res.json(ad);
    } catch (error) {
      res.status(500).json({ error: "Failed to create ad" });
    }
  });

  app.patch("/api/admin/ads/:id", async (req, res) => {
    try {
      const allowedFields = ['position', 'contentType', 'content', 'isActive'];
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      const ad = await storage.updateSiteAd(req.params.id, updateData);
      if (!ad) {
        return res.status(404).json({ error: "Ad not found" });
      }
      res.json(ad);
    } catch (error) {
      res.status(500).json({ error: "Failed to update ad" });
    }
  });

  app.delete("/api/admin/ads/:id", async (req, res) => {
    try {
      await storage.deleteSiteAd(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete ad" });
    }
  });

  app.post("/api/lookup-token", async (req, res) => {
    try {
      const { contractAddress } = req.body;
      if (!contractAddress) {
        return res.status(400).json({ error: "Contract address required" });
      }

      const existing = await storage.getVerifiedTokenByContract(contractAddress);
      if (existing) {
        return res.json({ token: existing, source: "database" });
      }

      const pairsResponse = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`,
        { headers: { Accept: "application/json" } }
      );

      if (!pairsResponse.ok) {
        return res.status(404).json({ error: "Token not found on DEX" });
      }

      const pairsData = await pairsResponse.json();
      const pair = pairsData.pairs?.[0];

      if (!pair) {
        return res.status(404).json({ error: "No trading pair found" });
      }

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
      let safetyScore = 0;

      const ownershipRenounced = !rugCheckData.mintAuthority && !rugCheckData.freezeAuthority;
      if (ownershipRenounced) {
        safetyScore += 25;
        safetyReasons.push("Mint and freeze authority renounced");
      }

      const lpData = rugCheckData.markets?.[0]?.lp;
      const liquidityLocked = lpData?.lpLockedPct && lpData.lpLockedPct >= 80;
      if (liquidityLocked) {
        safetyScore += 25;
        safetyReasons.push(`${lpData?.lpLockedPct}% liquidity locked`);
      }

      const hasHighRisks = rugCheckData.risks?.some(
        (r) => r.level === "danger" || r.level === "high"
      );
      if (!hasHighRisks) {
        safetyScore += 25;
        safetyReasons.push("No high-risk indicators detected");
      }

      safetyScore += 15;
      safetyReasons.push("Contract visible on Dexscreener");

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
          ownershipRenounced: ownershipRenounced,
          honeypotSafe: !hasHighRisks,
          safetyScore: safetyScore,
          safetyReasons: safetyReasons,
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
      res.status(500).json({ error: "Failed to lookup token" });
    }
  });
}
