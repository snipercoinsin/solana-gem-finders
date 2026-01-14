-- Create table for storing verified tokens
CREATE TABLE public.verified_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  contract_address TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL DEFAULT 'solana',
  launch_time TIMESTAMP WITH TIME ZONE NOT NULL,
  current_price NUMERIC,
  market_cap NUMERIC,
  liquidity_usd NUMERIC,
  volume_24h NUMERIC,
  liquidity_locked BOOLEAN DEFAULT false,
  liquidity_lock_duration_months INTEGER,
  ownership_renounced BOOLEAN DEFAULT false,
  contract_verified BOOLEAN DEFAULT false,
  honeypot_safe BOOLEAN DEFAULT false,
  buy_tax NUMERIC,
  sell_tax NUMERIC,
  safety_score INTEGER DEFAULT 0,
  dexscreener_url TEXT,
  solscan_url TEXT,
  rugcheck_url TEXT,
  twitter_url TEXT,
  telegram_url TEXT,
  website_url TEXT,
  safety_reasons TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for scan logs
CREATE TABLE public.scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_type TEXT NOT NULL,
  tokens_scanned INTEGER DEFAULT 0,
  tokens_passed INTEGER DEFAULT 0,
  tokens_failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for failed tokens (for transparency)
CREATE TABLE public.failed_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_name TEXT,
  token_symbol TEXT,
  contract_address TEXT NOT NULL,
  failure_reasons TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verified_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_tokens ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (no auth required for viewing)
CREATE POLICY "Anyone can view verified tokens" 
ON public.verified_tokens FOR SELECT USING (true);

CREATE POLICY "Anyone can view scan logs" 
ON public.scan_logs FOR SELECT USING (true);

CREATE POLICY "Anyone can view failed tokens" 
ON public.failed_tokens FOR SELECT USING (true);

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service can insert verified tokens" 
ON public.verified_tokens FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update verified tokens" 
ON public.verified_tokens FOR UPDATE USING (true);

CREATE POLICY "Service can insert scan logs" 
ON public.scan_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can insert failed tokens" 
ON public.failed_tokens FOR INSERT WITH CHECK (true);

-- Enable realtime for verified_tokens
ALTER PUBLICATION supabase_realtime ADD TABLE public.verified_tokens;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_verified_tokens_updated_at
BEFORE UPDATE ON public.verified_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_verified_tokens_launch_time ON public.verified_tokens(launch_time DESC);
CREATE INDEX idx_verified_tokens_safety_score ON public.verified_tokens(safety_score DESC);
CREATE INDEX idx_verified_tokens_contract ON public.verified_tokens(contract_address);