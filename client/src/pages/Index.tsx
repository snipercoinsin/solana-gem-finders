import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { ExpandedTokenCard } from '@/components/ExpandedTokenCard';
import { TokenTable } from '@/components/TokenTable';
import { StatusBar } from '@/components/StatusBar';
import { EmptyState } from '@/components/EmptyState';
import { UnifiedSearch } from '@/components/UnifiedSearch';
import { AdDisplay } from '@/components/AdDisplay';
import { useVerifiedTokens } from '@/hooks/useVerifiedTokens';
import { useScanLogs } from '@/hooks/useScanLogs';
import { formatTimeAgo } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Grid, List, Flame } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const SCAN_INTERVAL = 5 * 60; // 5 minutes in seconds

const Index = () => {
  const { tokens, loading, page, totalPages, totalCount, goToPage, refetch } = useVerifiedTokens();
  const { logs } = useScanLogs();
  const { toast } = useToast();
  
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [nextScanIn, setNextScanIn] = useState(SCAN_INTERVAL);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialScan = useRef(false);

  const lastScan = logs[0] ? formatTimeAgo(logs[0].createdAt) : null;

  const { data: featuredTokens } = useQuery({
    queryKey: ['/api/featured-tokens'],
  });

  useEffect(() => {
    fetch('/api/track-visit', { method: 'POST' }).catch(() => {});
  }, []);

  const doScan = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/scan-tokens', { method: 'POST' });
      if (!response.ok) throw new Error('Scan failed');
      const result = await response.json();
      toast({
        title: "Scan Complete",
        description: `Scanned ${result.scanned} tokens, ${result.passed} passed`,
      });
      refetch();
      setNextScanIn(SCAN_INTERVAL);
    } catch (err) {
      toast({
        title: "Scan Failed",
        description: err instanceof Error ? err.message : "Failed to run scan",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualScan = () => {
    doScan();
  };

  // Auto-scan on mount and every 5 minutes
  useEffect(() => {
    // Initial scan on mount (only once)
    if (!hasInitialScan.current) {
      hasInitialScan.current = true;
      doScan();
    }

    // Setup countdown timer
    countdownRef.current = setInterval(() => {
      setNextScanIn(prev => {
        if (prev <= 1) {
          return SCAN_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    // Setup auto-scan interval (every 5 minutes)
    scanTimeoutRef.current = setInterval(() => {
      doScan();
    }, SCAN_INTERVAL * 1000);

    return () => {
      if (scanTimeoutRef.current) clearInterval(scanTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const featuredAddresses = useMemo(() => 
    new Set((featuredTokens || []).map((t: any) => t.contractAddress.toLowerCase())),
    [featuredTokens]
  );

  const filteredTokens = useMemo(() => {
    const filtered = tokens.filter((token) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          token.tokenName.toLowerCase().includes(query) ||
          token.tokenSymbol.toLowerCase().includes(query) ||
          token.contractAddress.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const aFeatured = featuredAddresses.has(a.contractAddress.toLowerCase());
      const bFeatured = featuredAddresses.has(b.contractAddress.toLowerCase());
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return 0;
    });
  }, [tokens, searchQuery, featuredAddresses]);

  const hasFilters = !!searchQuery;

  const getPaginationNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (page > 3) pages.push('ellipsis');
      
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (page < totalPages - 2) pages.push('ellipsis');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background scanlines relative">
      <AdDisplay position="top" />
      <AdDisplay position="left" />
      <AdDisplay position="right" />
      
      <Header
        tokenCount={totalCount}
        lastScan={lastScan}
        onManualScan={handleManualScan}
        isScanning={isScanning}
        nextScanIn={nextScanIn}
      />

      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        <UnifiedSearch
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
        />
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {searchQuery ? `${filteredTokens.length} results for "${searchQuery}"` : `${totalCount} verified tokens`}
          </p>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
              data-testid="button-view-grid"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 w-8 p-0"
              data-testid="button-view-table"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {filteredTokens.length === 0 ? (
          <EmptyState
            isLoading={loading}
            hasFilters={hasFilters}
            onScan={handleManualScan}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTokens.map((token) => (
              <ExpandedTokenCard 
                key={token.id} 
                token={token} 
                isFeatured={featuredAddresses.has(token.contractAddress.toLowerCase())}
              />
            ))}
          </div>
        ) : (
          <TokenTable tokens={filteredTokens} />
        )}

        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Showing page {page} of {totalPages} ({totalCount.toLocaleString()} verified tokens)
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => goToPage(page - 1)}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {getPaginationNumbers().map((p, idx) => (
                  <PaginationItem key={idx}>
                    {p === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => goToPage(p)}
                        isActive={page === p}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => goToPage(page + 1)}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      <AdDisplay position="bottom" />
      <StatusBar />
    </div>
  );
};

export default Index;
