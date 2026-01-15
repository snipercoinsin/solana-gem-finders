import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  isLoading: boolean;
  hasFilters: boolean;
  onScan: () => void;
}

export function EmptyState({ isLoading, hasFilters, onScan }: EmptyStateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <RefreshCw className="w-12 h-12 text-primary animate-spin" />
          <div className="absolute inset-0 blur-xl bg-primary/30" />
        </div>
        <p className="mt-4 text-muted-foreground">Loading verified tokens...</p>
      </div>
    );
  }

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Search className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg text-foreground mb-2">No tokens match your filters</p>
        <p className="text-muted-foreground text-sm">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-lg">
      <div className="relative mb-4">
        <Search className="w-16 h-16 text-muted-foreground" />
      </div>
      <p className="text-xl text-foreground mb-2">No verified tokens yet</p>
      <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
        The scanner is waiting to find new Solana tokens that pass all safety checks. 
        Run a manual scan or wait for the automated scanner.
      </p>
      <Button onClick={onScan}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Start Scanning
      </Button>
    </div>
  );
}
