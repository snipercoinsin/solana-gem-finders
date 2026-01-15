import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  ExternalLink, 
  X, 
  Loader2, 
  Shield, 
  CheckCircle, 
  Lock, 
  AlertTriangle,
  Copy,
  Twitter,
  Globe,
  Send,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatPrice, formatCompact, truncateAddress } from '@/lib/formatters';

interface ScannedToken {
  tokenName: string;
  tokenSymbol: string;
  contractAddress: string;
  chain: string;
  launchTime: string;
  currentPrice: string | number | null;
  marketCap: string | number | null;
  liquidityUsd: string | number | null;
  volume24h: string | number | null;
  liquidityLocked: boolean;
  liquidityLockDurationMonths: number | null;
  ownershipRenounced: boolean;
  honeypotSafe: boolean;
  contractVerified: boolean;
  buyTax: string;
  sellTax: string;
  safetyScore: number;
  safetyReasons: string[];
  riskWarnings?: string[];
  imageUrl: string | null;
  priceChange24h: string | number | null;
  dexscreenerUrl: string | null;
  solscanUrl: string | null;
  rugcheckUrl: string | null;
  twitterUrl: string | null;
  telegramUrl: string | null;
  websiteUrl: string | null;
}

interface UnifiedSearchProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

export function UnifiedSearch({ onSearch, searchQuery }: UnifiedSearchProps) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [loading, setLoading] = useState(false);
  const [scannedToken, setScannedToken] = useState<ScannedToken | null>(null);
  const [scanSource, setScanSource] = useState<'database' | 'live' | null>(null);
  const { toast } = useToast();

  const isContractAddress = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length >= 32 && trimmed.length <= 50 && /^[a-zA-Z0-9]+$/.test(trimmed);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (!isContractAddress(value)) {
      onSearch(value);
      setScannedToken(null);
      setScanSource(null);
    }
  };

  const handleSearch = async () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) {
      onSearch('');
      setScannedToken(null);
      setScanSource(null);
      return;
    }

    if (isContractAddress(trimmedValue)) {
      setLoading(true);
      setScannedToken(null);
      
      try {
        const response = await fetch('/api/lookup-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractAddress: trimmedValue }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Token not found');
        }

        const data = await response.json();
        setScannedToken(data.token);
        setScanSource(data.source);
        onSearch('');
        
        toast({
          title: data.source === 'database' ? 'Token Found' : 'Token Scanned',
          description: `${data.token.tokenName} (${data.token.tokenSymbol}) - Safety Score: ${data.token.safetyScore}%`,
        });
      } catch (err) {
        toast({
          title: 'Scan Failed',
          description: err instanceof Error ? err.message : 'Failed to scan token',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else {
      onSearch(trimmedValue);
      setScannedToken(null);
      setScanSource(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
    setScannedToken(null);
    setScanSource(null);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ description: "Contract address copied!" });
  };

  const priceChangeValue = scannedToken?.priceChange24h;
  const priceChange = priceChangeValue !== null && priceChangeValue !== undefined 
    ? typeof priceChangeValue === 'string' ? parseFloat(priceChangeValue) : priceChangeValue 
    : null;
  const isPositiveChange = priceChange !== null && !isNaN(priceChange) && priceChange >= 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, symbol, or enter contract address to scan..."
            className="pl-10 pr-10 font-mono text-sm h-12 bg-card border-border focus:border-primary"
            data-testid="input-unified-search"
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground rounded hover-elevate"
              data-testid="button-clear-search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={loading}
          size="lg"
          className="h-12 px-6"
          data-testid="button-search"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </Button>
      </div>

      {scannedToken && (
        <Card className="border-primary/50 bg-card/95 backdrop-blur animate-in fade-in slide-in-from-top-2" data-testid="card-scanned-token">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-primary/50">
                  <AvatarImage 
                    src={scannedToken.imageUrl || undefined} 
                    alt={scannedToken.tokenSymbol} 
                  />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                    {scannedToken.tokenSymbol.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl text-primary glow-green">{scannedToken.tokenSymbol}</span>
                    <span className="text-lg text-muted-foreground font-normal">{scannedToken.tokenName}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {scannedToken.chain.toUpperCase()}
                    </Badge>
                    {scannedToken.safetyScore >= 75 ? (
                      <Badge className="bg-primary/20 text-primary text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        SAFE
                      </Badge>
                    ) : scannedToken.safetyScore >= 50 ? (
                      <Badge className="bg-yellow-500/20 text-yellow-500 text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        CAUTION
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500 text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        HIGH RISK
                      </Badge>
                    )}
                    {scanSource === 'database' && (
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                        Verified
                      </Badge>
                    )}
                    {scanSource === 'live' && (
                      <Badge variant="outline" className="text-xs">
                        Live Scan
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  scannedToken.safetyScore >= 75 ? 'bg-primary/20' : 
                  scannedToken.safetyScore >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                }`}>
                  <Shield className={`w-6 h-6 ${
                    scannedToken.safetyScore >= 75 ? 'text-primary' : 
                    scannedToken.safetyScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                  <span className={`text-2xl font-bold ${
                    scannedToken.safetyScore >= 75 ? 'text-primary' : 
                    scannedToken.safetyScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {scannedToken.safetyScore}%
                  </span>
                </div>
                {priceChange !== null && priceChange !== undefined && (
                  <div className={`flex items-center gap-1 text-sm ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isPositiveChange ? '+' : ''}{priceChange.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block mb-1">Price</span>
                <span className="text-lg font-mono text-foreground">
                  {formatPrice(scannedToken.currentPrice)}
                </span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block mb-1">Market Cap</span>
                <span className="text-lg font-mono text-foreground">
                  ${formatCompact(scannedToken.marketCap)}
                </span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block mb-1">Liquidity</span>
                <span className="text-lg font-mono text-secondary">
                  ${formatCompact(scannedToken.liquidityUsd)}
                </span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-xs text-muted-foreground block mb-1">24h Volume</span>
                <span className="text-lg font-mono text-foreground">
                  ${formatCompact(scannedToken.volume24h)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2">
              <code className="text-sm text-muted-foreground font-mono">
                {truncateAddress(scannedToken.contractAddress, 12)}
              </code>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyAddress(scannedToken.contractAddress)}
                  data-testid="button-copy-scanned-address"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {scannedToken.dexscreenerUrl && (
                  <a
                    href={scannedToken.dexscreenerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {scannedToken.ownershipRenounced && (
                <Badge variant="outline" className="border-primary/50 text-primary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ownership Renounced
                </Badge>
              )}
              {scannedToken.liquidityLocked && (
                <Badge variant="outline" className="border-secondary/50 text-secondary">
                  <Lock className="w-3 h-3 mr-1" />
                  Liquidity Locked {scannedToken.liquidityLockDurationMonths}mo
                </Badge>
              )}
              {scannedToken.contractVerified && (
                <Badge variant="outline" className="border-primary/50 text-primary">
                  <Shield className="w-3 h-3 mr-1" />
                  Contract Verified
                </Badge>
              )}
              {scannedToken.honeypotSafe && (
                <Badge variant="outline" className="border-primary/50 text-primary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Honeypot Safe
                </Badge>
              )}
              <Badge variant="outline" className="border-muted-foreground/50">
                Tax: {scannedToken.buyTax}/{scannedToken.sellTax}%
              </Badge>
            </div>

            {scannedToken.riskWarnings && scannedToken.riskWarnings.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Warnings
                </h4>
                <ul className="space-y-1">
                  {scannedToken.riskWarnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-400">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Safety Analysis
                </h4>
                <ul className="space-y-1">
                  {scannedToken.safetyReasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Links</h4>
                <div className="flex flex-wrap gap-2">
                  {scannedToken.twitterUrl && (
                    <a
                      href={scannedToken.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Twitter className="w-4 h-4 mr-1" /> Twitter
                      </Button>
                    </a>
                  )}
                  {scannedToken.telegramUrl && (
                    <a
                      href={scannedToken.telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Send className="w-4 h-4 mr-1" /> Telegram
                      </Button>
                    </a>
                  )}
                  {scannedToken.websiteUrl && (
                    <a
                      href={scannedToken.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Globe className="w-4 h-4 mr-1" /> Website
                      </Button>
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {scannedToken.solscanUrl && (
                    <a
                      href={scannedToken.solscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground underline rounded px-1 hover-elevate"
                    >
                      Solscan
                    </a>
                  )}
                  {scannedToken.rugcheckUrl && (
                    <a
                      href={scannedToken.rugcheckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground underline rounded px-1 hover-elevate"
                    >
                      RugCheck
                    </a>
                  )}
                  {scannedToken.dexscreenerUrl && (
                    <a
                      href={scannedToken.dexscreenerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground underline rounded px-1 hover-elevate"
                    >
                      Dexscreener
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
