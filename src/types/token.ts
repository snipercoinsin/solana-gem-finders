export interface VerifiedToken {
  id: string;
  token_name: string;
  token_symbol: string;
  contract_address: string;
  chain: string;
  launch_time: string;
  current_price: number | null;
  market_cap: number | null;
  liquidity_usd: number | null;
  volume_24h: number | null;
  liquidity_locked: boolean;
  liquidity_lock_duration_months: number | null;
  ownership_renounced: boolean;
  contract_verified: boolean;
  honeypot_safe: boolean;
  buy_tax: number | null;
  sell_tax: number | null;
  safety_score: number;
  dexscreener_url: string | null;
  solscan_url: string | null;
  rugcheck_url: string | null;
  twitter_url: string | null;
  telegram_url: string | null;
  website_url: string | null;
  safety_reasons: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ScanLog {
  id: string;
  scan_type: string;
  tokens_scanned: number;
  tokens_passed: number;
  tokens_failed: number;
  error_message: string | null;
  created_at: string;
}

export interface FailedToken {
  id: string;
  token_name: string | null;
  token_symbol: string | null;
  contract_address: string;
  failure_reasons: string[] | null;
  created_at: string;
}
