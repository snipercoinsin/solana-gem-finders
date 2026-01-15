import { useState } from 'react';
import { VerifiedToken } from '@/hooks/useVerifiedTokens';
import { formatPrice, formatCompact, formatTimeAgo, truncateAddress } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ExternalLink, 
  Copy, 
  Shield, 
  Lock, 
  CheckCircle, 
  Globe,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Flame,
  Search,
  ShieldCheck
} from 'lucide-react';
import { FaXTwitter, FaTelegram } from 'react-icons/fa6';
import { SiSolana } from 'react-icons/si';
import { useToast } from '@/hooks/use-toast';

interface ExpandedTokenCardProps {
  token: VerifiedToken;
  isNew?: boolean;
  isFeatured?: boolean;
}

export function ExpandedTokenCard({ token, isNew, isFeatured }: ExpandedTokenCardProps) {
  const { toast } = useToast();
  const [chartOpen, setChartOpen] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(token.contractAddress);
    toast({ description: "Contract address copied!" });
  };

  const isRecent = () => {
    const launchTime = new Date(token.launchTime);
    const now = new Date();
    return now.getTime() - launchTime.getTime() < 3600000;
  };

  const priceChange = token.priceChange24h ? parseFloat(token.priceChange24h.toString()) : null;
  const isPositiveChange = priceChange !== null && priceChange >= 0;

  return (
    <Card 
      className={`border-border bg-card hover-elevate ${
        isNew ? 'pulse-new' : ''
      } ${isRecent() ? 'border-primary/30' : ''} ${isFeatured ? 'border-orange-500/50 ring-1 ring-orange-500/30' : ''}`}
      data-testid={`card-token-${token.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage 
                  src={token.imageUrl || undefined} 
                  alt={token.tokenSymbol} 
                />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {token.tokenSymbol.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isRecent() && (
                <Badge className="badge-new-glow text-[7px] px-1 py-0 absolute -top-1 -left-1 rounded-sm">
                  NEW
                </Badge>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {isFeatured && (
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                )}
                <span className="text-lg font-bold text-foreground glow-green">
                  {token.tokenSymbol}
                </span>
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-[10px] text-primary font-medium">LIVE</span>
                </div>
              </div>
              <span className="text-muted-foreground text-xs">
                {token.tokenName}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold">{token.safetyScore}%</span>
            </div>
            {priceChange !== null && (
              <div className={`flex items-center gap-1 text-xs ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                {isPositiveChange ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositiveChange ? '+' : ''}{priceChange.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground block">Price</span>
            <span className="text-foreground font-mono">{formatPrice(token.currentPrice)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">MCap</span>
            <span className="text-foreground font-mono">${formatCompact(token.marketCap)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Liq</span>
            <span className="text-secondary font-mono">${formatCompact(token.liquidityUsd)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Vol 24h</span>
            <span className="text-foreground font-mono">${formatCompact(token.volume24h)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
          <code className="text-xs text-muted-foreground font-mono">
            {truncateAddress(token.contractAddress, 8)}
          </code>
          <div className="flex items-center gap-1">
            <button
              onClick={copyAddress}
              className="p-1 rounded hover-elevate"
              data-testid="button-copy-address"
            >
              <Copy className="w-3 h-3" />
            </button>
            {token.dexscreenerUrl && (
              <a
                href={token.dexscreenerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover-elevate"
                data-testid="link-dexscreener"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {token.ownershipRenounced && (
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
              <CheckCircle className="w-2.5 h-2.5 mr-1" />
              Ownership
            </Badge>
          )}
          {token.liquidityLocked && (
            <Badge variant="outline" className="text-[10px] border-secondary/50 text-secondary">
              <Lock className="w-2.5 h-2.5 mr-1" />
              Locked {token.liquidityLockDurationMonths}mo
            </Badge>
          )}
          {token.contractVerified && (
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
              <Shield className="w-2.5 h-2.5 mr-1" />
              Verified
            </Badge>
          )}
          {token.honeypotSafe && (
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
              <CheckCircle className="w-2.5 h-2.5 mr-1" />
              Safe
            </Badge>
          )}
          {(token.buyTax !== null && parseFloat(token.buyTax) < 10) && (
            <Badge variant="outline" className="text-[10px] border-muted-foreground/50">
              Tax: {token.buyTax}/{token.sellTax}%
            </Badge>
          )}
        </div>

        <div className="pt-2 border-t border-border space-y-2">
          <div className="text-xs text-muted-foreground">
            Launched: {formatTimeAgo(token.launchTime)}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {token.twitterUrl && (
              <a
                href={token.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground rounded px-1 hover-elevate"
                data-testid="link-twitter"
              >
                <FaXTwitter className="w-3 h-3" /> Twitter
              </a>
            )}
            {token.telegramUrl && (
              <a
                href={token.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground rounded px-1 hover-elevate"
                data-testid="link-telegram"
              >
                <FaTelegram className="w-3 h-3 text-sky-500" /> Telegram
              </a>
            )}
            {token.websiteUrl && (
              <a
                href={token.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground rounded px-1 hover-elevate"
                data-testid="link-website"
              >
                <Globe className="w-3 h-3" /> Website
              </a>
            )}
          </div>

          {token.safetyReasons && token.safetyReasons.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Safety Analysis:</span>
              <ul className="text-xs space-y-0.5">
                {token.safetyReasons.slice(0, 3).map((reason, i) => (
                  <li key={i} className="flex items-start gap-1 text-primary">
                    <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-3">
              {token.solscanUrl && (
                <a
                  href={token.solscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground rounded px-1 hover-elevate"
                  data-testid="link-solscan"
                >
                  <SiSolana className="w-3 h-3 text-violet-500" />
                  <span>Solscan</span>
                </a>
              )}
              {token.rugcheckUrl && (
                <a
                  href={token.rugcheckUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground rounded px-1 hover-elevate"
                  data-testid="link-rugcheck"
                >
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span>RugCheck</span>
                </a>
              )}
              {token.dexscreenerUrl && (
                <a
                  href={token.dexscreenerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground rounded px-1 hover-elevate"
                >
                  <Search className="w-3 h-3 text-primary" />
                  <span>Dexscreener</span>
                </a>
              )}
            </div>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setChartOpen(!chartOpen)}
              className={`h-7 w-7 ${chartOpen ? 'text-primary' : ''}`}
              data-testid="button-chart"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          </div>

          {chartOpen && (
            <div className="mt-3 rounded-lg overflow-hidden bg-black" style={{ height: '200px' }}>
              <iframe
                src={`https://dexscreener.com/solana/${token.contractAddress}?embed=1&theme=dark&info=0&trades=0`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={`${token.tokenSymbol} Chart`}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
