import { VerifiedToken } from '@/hooks/useVerifiedTokens';
import { formatPrice, formatCompact, formatTimeAgo, truncateAddress } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  ExternalLink, 
  Copy, 
  Shield, 
  Lock, 
  CheckCircle, 
  Twitter,
  Send,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExpandedTokenCardProps {
  token: VerifiedToken;
  isNew?: boolean;
}

export function ExpandedTokenCard({ token, isNew }: ExpandedTokenCardProps) {
  const { toast } = useToast();

  const copyAddress = () => {
    navigator.clipboard.writeText(token.contractAddress);
    toast({ description: "Contract address copied!" });
  };

  const isRecent = () => {
    const launchTime = new Date(token.launchTime);
    const now = new Date();
    return now.getTime() - launchTime.getTime() < 3600000;
  };

  return (
    <Card 
      className={`border-border bg-card hover:border-primary/50 transition-all ${
        isNew ? 'pulse-new' : ''
      } ${isRecent() ? 'border-primary/30' : ''}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isRecent() && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5">
                NEW
              </Badge>
            )}
            <span className="text-lg font-bold text-foreground glow-green">
              {token.tokenSymbol}
            </span>
            <span className="text-muted-foreground text-sm">
              {token.tokenName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-primary font-bold">{token.safetyScore}%</span>
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
              className="p-1 hover:text-primary transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
            {token.dexscreenerUrl && (
              <a
                href={token.dexscreenerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:text-primary transition-colors"
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
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                <Twitter className="w-3 h-3" /> Twitter
              </a>
            )}
            {token.telegramUrl && (
              <a
                href={token.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary"
              >
                <Send className="w-3 h-3" /> Telegram
              </a>
            )}
            {token.websiteUrl && (
              <a
                href={token.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
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

          <div className="flex gap-2 pt-1">
            {token.solscanUrl && (
              <a
                href={token.solscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary underline"
              >
                Solscan
              </a>
            )}
            {token.rugcheckUrl && (
              <a
                href={token.rugcheckUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary underline"
              >
                RugCheck
              </a>
            )}
            {token.dexscreenerUrl && (
              <a
                href={token.dexscreenerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary underline"
              >
                Dexscreener
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
