import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { ExpandedTokenCard } from '@/components/ExpandedTokenCard';
import { TokenTable } from '@/components/TokenTable';
import { StatusBar } from '@/components/StatusBar';
import { EmptyState } from '@/components/EmptyState';
import { ContractLookup } from '@/components/ContractLookup';
import { AdDisplay } from '@/components/AdDisplay';
import { useVerifiedTokens } from '@/hooks/useVerifiedTokens';
import { useScanLogs } from '@/hooks/useScanLogs';
import { formatTimeAgo } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const Index = () => {
  const { tokens, loading, page, totalPages, totalCount, goToPage, refetch } = useVerifiedTokens();
  const { logs } = useScanLogs();
  const { toast } = useToast();
  
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const lastScan = logs[0] ? formatTimeAgo(logs[0].createdAt) : null;

  const handleManualScan = async () => {
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

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
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
  }, [tokens, searchQuery]);

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
      />

      <main className="flex-1 container mx-auto px-4 py-6 space-y-4">
        {/* Contract Lookup */}
        <ContractLookup />
        
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {filteredTokens.length === 0 ? (
          <EmptyState
            isLoading={loading}
            hasFilters={hasFilters}
            onScan={handleManualScan}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTokens.map((token, index) => (
              <ExpandedTokenCard key={token.id} token={token} isNew={index === 0 && page === 1} />
            ))}
          </div>
        ) : (
          <TokenTable tokens={filteredTokens} />
        )}

        {/* Pagination */}
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
