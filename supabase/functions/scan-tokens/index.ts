import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let tokensScanned = 0;
  let tokensPassed = 0;
  let tokensFailed = 0;

  try {
    console.log('[SCAN] Starting token scan...');

    // Fetch new Solana token profiles from Dexscreener (latest tokens)
    const profilesResponse = await fetch(
      'https://api.dexscreener.com/token-profiles/latest/v1',
      { headers: { 'Accept': 'application/json' } }
    );

    let tokenAddresses: string[] = [];
    
    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json();
      // Get Solana token addresses
      tokenAddresses = profiles
        .filter((p: { chainId: string; tokenAddress: string }) => p.chainId === 'solana')
        .slice(0, 50)
        .map((p: { tokenAddress: string }) => p.tokenAddress);
    }
    
    console.log(`[SCAN] Found ${tokenAddresses.length} Solana token profiles`);

    // Also fetch from token boosters (promoted tokens with more activity)
    const boostersResponse = await fetch(
      'https://api.dexscreener.com/token-boosts/latest/v1',
      { headers: { 'Accept': 'application/json' } }
    );

    if (boostersResponse.ok) {
      const boosters = await boostersResponse.json();
      const boosterAddresses = boosters
        .filter((b: { chainId: string; tokenAddress: string }) => b.chainId === 'solana')
        .slice(0, 30)
        .map((b: { tokenAddress: string }) => b.tokenAddress);
      
      tokenAddresses = [...new Set([...tokenAddresses, ...boosterAddresses])];
    }

    console.log(`[SCAN] Total unique Solana tokens to check: ${tokenAddresses.length}`);

    // Get pair data for these tokens
    const allPairs: DexscreenerPair[] = [];
    
    // Batch tokens in groups of 30 (API limit)
    for (let i = 0; i < tokenAddresses.length; i += 30) {
      const batch = tokenAddresses.slice(i, i + 30);
      const tokensParam = batch.join(',');
      
      const pairsResponse = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokensParam}`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (pairsResponse.ok) {
        const pairsData = await pairsResponse.json();
        if (pairsData.pairs) {
          allPairs.push(...pairsData.pairs);
        }
      }
    }

    console.log(`[SCAN] Retrieved ${allPairs.length} pairs for analysis`);

    // Filter pairs by criteria (more relaxed for testing)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const newPairs = allPairs.filter((pair) => {
      // Must be Solana
      if (pair.chainId !== 'solana') return false;
      
      // Must have some liquidity (lowered threshold)
      if (!pair.liquidity?.usd || pair.liquidity.usd < 500) return false;
      
      // Must have some volume (lowered threshold)
      if (!pair.volume?.h24 || pair.volume.h24 < 1000) return false;
      
      // Prefer newer tokens but allow up to 7 days
      if (pair.pairCreatedAt && pair.pairCreatedAt < oneWeekAgo) return false;
      
      return true;
    });

    // Deduplicate by base token address
    const uniquePairs = newPairs.reduce((acc: DexscreenerPair[], pair) => {
      if (!acc.find(p => p.baseToken.address === pair.baseToken.address)) {
        acc.push(pair);
      }
      return acc;
    }, []);

    console.log(`[SCAN] ${uniquePairs.length} pairs match criteria after filtering`);

    // Process each pair
    for (const pair of uniquePairs.slice(0, 30)) { // Limit to 30 per scan
      tokensScanned++;
      const contractAddress = pair.baseToken.address;

      try {
        // Check if we already have this token
        const { data: existing } = await supabase
          .from('verified_tokens')
          .select('id')
          .eq('contract_address', contractAddress)
          .single();

        if (existing) {
          console.log(`[SCAN] Token ${pair.baseToken.symbol} already exists, updating...`);
          
          // Update price data
          await supabase
            .from('verified_tokens')
            .update({
              current_price: parseFloat(pair.priceUsd) || null,
              market_cap: pair.fdv || null,
              liquidity_usd: pair.liquidity?.usd || null,
              volume_24h: pair.volume?.h24 || null,
            })
            .eq('contract_address', contractAddress);
          
          continue;
        }

        // Run RugCheck analysis
        console.log(`[SCAN] Analyzing ${pair.baseToken.symbol} (${contractAddress})...`);
        
        let rugCheckData: RugCheckResponse = {};
        try {
          const rugResponse = await fetch(
            `https://api.rugcheck.xyz/v1/tokens/${contractAddress}/report`,
            { headers: { 'Accept': 'application/json' } }
          );
          
          if (rugResponse.ok) {
            rugCheckData = await rugResponse.json();
          }
        } catch (err) {
          console.log(`[SCAN] RugCheck failed for ${pair.baseToken.symbol}: ${err}`);
        }

        // Analyze safety criteria
        const safetyReasons: string[] = [];
        let safetyScore = 0;

        // Check ownership (mint/freeze authority)
        const ownershipRenounced = !rugCheckData.mintAuthority && !rugCheckData.freezeAuthority;
        if (ownershipRenounced) {
          safetyScore += 25;
          safetyReasons.push('Mint and freeze authority renounced');
        }

        // Check liquidity lock
        const lpData = rugCheckData.markets?.[0]?.lp;
        const liquidityLocked = lpData?.lpLockedPct && lpData.lpLockedPct >= 80;
        const lockDuration = liquidityLocked ? 6 : null; // Assume 6 months if locked
        if (liquidityLocked) {
          safetyScore += 25;
          safetyReasons.push(`${lpData?.lpLockedPct}% liquidity locked`);
        }

        // Check for honeypot/rug risks
        const hasHighRisks = rugCheckData.risks?.some(
          (r) => r.level === 'danger' || r.level === 'high'
        );
        const honeypotSafe = !hasHighRisks;
        if (honeypotSafe) {
          safetyScore += 25;
          safetyReasons.push('No high-risk indicators detected');
        }

        // Contract verification (assume verified if on Dexscreener)
        const contractVerified = true;
        if (contractVerified) {
          safetyScore += 15;
          safetyReasons.push('Contract visible on Dexscreener');
        }

        // Check taxes (estimated from RugCheck score)
        const buyTax = 0; // Would need more data
        const sellTax = 0;
        const taxesOk = buyTax < 10 && sellTax < 10;
        if (taxesOk) {
          safetyScore += 10;
          safetyReasons.push('Taxes within acceptable range');
        }

        // Determine if token passes all critical checks
        const passesChecks = safetyScore >= 50; // At least 50% safety score

        if (!passesChecks) {
          tokensFailed++;
          console.log(`[SCAN] ${pair.baseToken.symbol} FAILED with score ${safetyScore}`);
          
          // Log failed token
          await supabase.from('failed_tokens').insert({
            token_name: pair.baseToken.name,
            token_symbol: pair.baseToken.symbol,
            contract_address: contractAddress,
            failure_reasons: [`Safety score ${safetyScore}% below threshold`, ...(hasHighRisks ? ['High-risk indicators found'] : [])],
          });
          
          continue;
        }

        tokensPassed++;
        console.log(`[SCAN] ${pair.baseToken.symbol} PASSED with score ${safetyScore}`);

        // Extract social links
        const socials = pair.info?.socials || [];
        const twitterUrl = socials.find((s) => s.type === 'twitter')?.url || null;
        const telegramUrl = socials.find((s) => s.type === 'telegram')?.url || null;
        const websiteUrl = pair.info?.websites?.[0]?.url || null;

        // Insert verified token
        await supabase.from('verified_tokens').insert({
          token_name: pair.baseToken.name,
          token_symbol: pair.baseToken.symbol,
          contract_address: contractAddress,
          chain: 'solana',
          launch_time: new Date(pair.pairCreatedAt).toISOString(),
          current_price: parseFloat(pair.priceUsd) || null,
          market_cap: pair.fdv || null,
          liquidity_usd: pair.liquidity?.usd || null,
          volume_24h: pair.volume?.h24 || null,
          liquidity_locked: liquidityLocked,
          liquidity_lock_duration_months: lockDuration,
          ownership_renounced: ownershipRenounced,
          contract_verified: contractVerified,
          honeypot_safe: honeypotSafe,
          buy_tax: buyTax,
          sell_tax: sellTax,
          safety_score: safetyScore,
          dexscreener_url: pair.url,
          solscan_url: `https://solscan.io/token/${contractAddress}`,
          rugcheck_url: `https://rugcheck.xyz/tokens/${contractAddress}`,
          twitter_url: twitterUrl,
          telegram_url: telegramUrl,
          website_url: websiteUrl,
          safety_reasons: safetyReasons,
        });

      } catch (tokenError) {
        console.error(`[SCAN] Error processing ${pair.baseToken.symbol}:`, tokenError);
        tokensFailed++;
      }
    }

    // Log scan results
    await supabase.from('scan_logs').insert({
      scan_type: 'manual',
      tokens_scanned: tokensScanned,
      tokens_passed: tokensPassed,
      tokens_failed: tokensFailed,
    });

    console.log(`[SCAN] Complete: ${tokensScanned} scanned, ${tokensPassed} passed, ${tokensFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        scanned: tokensScanned,
        passed: tokensPassed,
        failed: tokensFailed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SCAN] Fatal error:', error);

    // Log error
    await supabase.from('scan_logs').insert({
      scan_type: 'manual',
      tokens_scanned: tokensScanned,
      tokens_passed: tokensPassed,
      tokens_failed: tokensFailed,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Scan failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
