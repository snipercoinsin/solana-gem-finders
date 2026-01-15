import { VerifiedToken } from '@/hooks/useVerifiedTokens';
import { formatPrice, formatCompact, formatTimeAgo, truncateAddress } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, Copy, Shield, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface TokenTableProps {
  tokens: VerifiedToken[];
}

type SortKey = 'launchTime' | 'safetyScore' | 'liquidityUsd' | 'marketCap' | 'volume24h';
type SortOrder = 'asc' | 'desc';

export function TokenTable({ tokens }: TokenTableProps) {
  const { toast } = useToast();
  const [sortKey, setSortKey] = useState<SortKey>('launchTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ description: "Contract address copied!" });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedTokens = [...tokens].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const isRecent = (launchTime: string) => {
    const launch = new Date(launchTime);
    const now = new Date();
    return now.getTime() - launch.getTime() < 3600000;
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead 
      className="cursor-pointer hover-elevate"
      onClick={() => handleSort(sortKeyName)}
    >
      {label} {sortKey === sortKeyName && (sortOrder === 'desc' ? '↓' : '↑')}
    </TableHead>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Token</TableHead>
            <TableHead>Contract</TableHead>
            <SortHeader label="Price" sortKeyName="marketCap" />
            <SortHeader label="Liquidity" sortKeyName="liquidityUsd" />
            <SortHeader label="Volume" sortKeyName="volume24h" />
            <SortHeader label="Safety" sortKeyName="safetyScore" />
            <TableHead>Status</TableHead>
            <SortHeader label="Launch" sortKeyName="launchTime" />
            <TableHead>Links</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTokens.map((token) => (
            <TableRow 
              key={token.id} 
              className={`border-border ${isRecent(token.launchTime) ? 'bg-primary/5' : ''}`}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  {isRecent(token.launchTime) && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-1">
                      NEW
                    </Badge>
                  )}
                  <div>
                    <span className="font-bold text-foreground">{token.tokenSymbol}</span>
                    <span className="text-muted-foreground text-xs block">{token.tokenName}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <code className="text-xs text-muted-foreground font-mono">
                    {truncateAddress(token.contractAddress, 4)}
                  </code>
                  <button
                    onClick={() => copyAddress(token.contractAddress)}
                    className="p-0.5 rounded hover-elevate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <span className="font-mono text-foreground">{formatPrice(token.currentPrice)}</span>
                  <span className="text-muted-foreground text-xs block">
                    MCap: ${formatCompact(token.marketCap)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-secondary">${formatCompact(token.liquidityUsd)}</span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-foreground">${formatCompact(token.volume24h)}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-bold text-primary">{token.safetyScore}%</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {token.ownershipRenounced && (
                    <span title="Ownership Renounced"><CheckCircle className="w-3.5 h-3.5 text-primary" /></span>
                  )}
                  {token.liquidityLocked && (
                    <span title="Liquidity Locked"><Lock className="w-3.5 h-3.5 text-secondary" /></span>
                  )}
                  {token.contractVerified && (
                    <span title="Contract Verified"><Shield className="w-3.5 h-3.5 text-primary" /></span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground text-xs">{formatTimeAgo(token.launchTime)}</span>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {token.dexscreenerUrl && (
                    <a
                      href={token.dexscreenerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover-elevate"
                      title="Dexscreener"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
