import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, ExternalLink, X, Loader2 } from 'lucide-react';
import { formatPrice, formatCompact } from '@/lib/formatters';

interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
  priceUsd: number | null;
  marketCap: number | null;
  liquidity: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
  dexUrl: string | null;
  chain: string;
}

export function ContractLookup() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!address.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a contract address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setTokenInfo(null);

    try {
      // Fetch from Dexscreener API
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address.trim()}`);
      
      if (!response.ok) throw new Error('Failed to fetch token data');
      
      const data = await response.json();
      
      if (!data.pairs || data.pairs.length === 0) {
        toast({
          title: 'Not Found',
          description: 'No trading pairs found for this address',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Get the pair with highest liquidity
      const pair = data.pairs.reduce((best: any, current: any) => {
        const bestLiq = best?.liquidity?.usd || 0;
        const currentLiq = current?.liquidity?.usd || 0;
        return currentLiq > bestLiq ? current : best;
      }, data.pairs[0]);

      setTokenInfo({
        name: pair.baseToken?.name || 'Unknown',
        symbol: pair.baseToken?.symbol || 'N/A',
        address: pair.baseToken?.address || address,
        priceUsd: pair.priceUsd ? parseFloat(pair.priceUsd) : null,
        marketCap: pair.marketCap || null,
        liquidity: pair.liquidity?.usd || null,
        volume24h: pair.volume?.h24 || null,
        priceChange24h: pair.priceChange?.h24 || null,
        dexUrl: pair.url || null,
        chain: pair.chainId || 'unknown',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to lookup token. Please check the address and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setAddress('');
    setTokenInfo(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter contract address to lookup any token..."
            className="pr-8 font-mono text-sm"
          />
          {address && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground rounded hover-elevate"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {tokenInfo && (
        <Card className="border-primary/30 bg-card/80 animate-in fade-in slide-in-from-top-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary glow-green">{tokenInfo.symbol}</span>
                <span className="text-muted-foreground text-sm font-normal">{tokenInfo.name}</span>
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {tokenInfo.chain.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">Price</span>
                <span className="font-mono text-foreground">
                  {tokenInfo.priceUsd ? formatPrice(tokenInfo.priceUsd) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Market Cap</span>
                <span className="font-mono text-foreground">
                  {tokenInfo.marketCap ? `$${formatCompact(tokenInfo.marketCap)}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Liquidity</span>
                <span className="font-mono text-secondary">
                  {tokenInfo.liquidity ? `$${formatCompact(tokenInfo.liquidity)}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">24h Volume</span>
                <span className="font-mono text-foreground">
                  {tokenInfo.volume24h ? `$${formatCompact(tokenInfo.volume24h)}` : 'N/A'}
                </span>
              </div>
            </div>

            {tokenInfo.priceChange24h !== null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">24h Change:</span>
                <span className={`font-mono text-sm ${
                  tokenInfo.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {tokenInfo.priceChange24h >= 0 ? '+' : ''}{tokenInfo.priceChange24h.toFixed(2)}%
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <code className="text-xs text-muted-foreground font-mono truncate max-w-[200px] md:max-w-none">
                {tokenInfo.address}
              </code>
              {tokenInfo.dexUrl && (
                <a
                  href={tokenInfo.dexUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View on Dexscreener
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
