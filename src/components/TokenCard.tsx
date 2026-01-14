import { VerifiedToken } from '@/types/token';
import { formatPrice, formatCompact, formatTimeAgo, truncateAddress } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  ExternalLink, 
  Copy, 
  Shield, 
  Lock, 
  CheckCircle, 
  AlertTriangle,
  Twitter,
  Send,
  Globe
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TokenCardProps {
  token: VerifiedToken;
  isNew?: boolean;
}

export function TokenCard({ token, isNew }: TokenCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const copyAddress = () => {
    navigator.clipboard.writeText(token.contract_address);
    toast({ description: "Contract address copied!" });
  };

  const isRecent = () => {
    const launchTime = new Date(token.launch_time);
    const now = new Date();
    return now.getTime() - launchTime.getTime() < 3600000; // 1 hour
  };

  return (
    <Card 
      className={`border-border bg-card hover:border-primary/50 transition-all cursor-pointer ${
        isNew ? 'pulse-new' : ''
      } ${isRecent() ? 'border-primary/30' : ''}`}
      onClick={() => setExpanded(!expanded)}
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
              {token.token_symbol}
            </span>
            <span className="text-muted-foreground text-sm">
              {token.token_name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-primary font-bold">{token.safety_score}%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Price & Market Data Row */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground block">Price</span>
            <span className="text-foreground font-mono">{formatPrice(token.current_price)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">MCap</span>
            <span className="text-foreground font-mono">${formatCompact(token.market_cap)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Liq</span>
            <span className="text-secondary font-mono">${formatCompact(token.liquidity_usd)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Vol 24h</span>
            <span className="text-foreground font-mono">${formatCompact(token.volume_24h)}</span>
          </div>
        </div>

        {/* Contract Address */}
        <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
          <code className="text-xs text-muted-foreground font-mono">
            {truncateAddress(token.contract_address, 8)}
          </code>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); copyAddress(); }}
              className="p-1 hover:text-primary transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
            {token.dexscreener_url && (
              <a
                href={token.dexscreener_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Safety Badges */}
        <div className="flex flex-wrap gap-1">
          {token.ownership_renounced && (
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
              <CheckCircle className="w-2.5 h-2.5 mr-1" />
              Ownership
            </Badge>
          )}
          {token.liquidity_locked && (
            <Badge variant="outline" className="text-[10px] border-secondary/50 text-secondary">
              <Lock className="w-2.5 h-2.5 mr-1" />
              Locked {token.liquidity_lock_duration_months}mo
            </Badge>
          )}
          {token.contract_verified && (
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
              <Shield className="w-2.5 h-2.5 mr-1" />
              Verified
            </Badge>
          )}
          {token.honeypot_safe && (
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
              <CheckCircle className="w-2.5 h-2.5 mr-1" />
              Safe
            </Badge>
          )}
          {(token.buy_tax !== null && token.buy_tax < 10) && (
            <Badge variant="outline" className="text-[10px] border-muted-foreground/50">
              Tax: {token.buy_tax}/{token.sell_tax}%
            </Badge>
          )}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="pt-2 border-t border-border space-y-2 animate-in fade-in duration-200">
            <div className="text-xs text-muted-foreground">
              Launched: {formatTimeAgo(token.launch_time)}
            </div>
            
            {/* Social Links */}
            <div className="flex gap-2">
              {token.twitter_url && (
                <a
                  href={token.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <Twitter className="w-3 h-3" /> Twitter
                </a>
              )}
              {token.telegram_url && (
                <a
                  href={token.telegram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary"
                >
                  <Send className="w-3 h-3" /> Telegram
                </a>
              )}
              {token.website_url && (
                <a
                  href={token.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
                >
                  <Globe className="w-3 h-3" /> Website
                </a>
              )}
            </div>

            {/* Safety Reasons */}
            {token.safety_reasons && token.safety_reasons.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Safety Analysis:</span>
                <ul className="text-xs space-y-0.5">
                  {token.safety_reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-1 text-primary">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Links */}
            <div className="flex gap-2 pt-1">
              {token.solscan_url && (
                <a
                  href={token.solscan_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary underline"
                >
                  Solscan
                </a>
              )}
              {token.rugcheck_url && (
                <a
                  href={token.rugcheck_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary underline"
                >
                  RugCheck
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
