import { Activity, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface HeaderProps {
  tokenCount: number;
  lastScan: string | null;
  onManualScan: () => void;
  isScanning: boolean;
}

export function Header({ tokenCount, lastScan, onManualScan, isScanning }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 blur-lg bg-primary/30" />
            </div>
            <div>
              <h1 className="text-xl font-bold glow-green">SOLANA SCANNER</h1>
              <p className="text-xs text-muted-foreground">Real-time Token Analysis</p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">{tokenCount}</span>
              <span className="text-xs text-muted-foreground block">Verified Tokens</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm text-primary">LIVE</span>
              </div>
              <span className="text-xs text-muted-foreground block">
                {lastScan ? `Last: ${lastScan}` : 'Scanning...'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={onManualScan}
              disabled={isScanning}
              className="border-primary/50 hover:bg-primary/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
