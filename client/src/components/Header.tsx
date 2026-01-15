import { Activity, Zap, RefreshCw, Copy } from 'lucide-react';
import { FaXTwitter, FaTelegram } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  tokenCount: number;
  lastScan: string | null;
  onManualScan: () => void;
  isScanning: boolean;
  nextScanIn?: number;
}

const DONATION_ADDRESS = "6442kzhiuE78vVBKJkwPetc1jfydDaUbydYrrV3Au3We";
const TWITTER_URL = "https://x.com/DarWebDZ";
const TELEGRAM_URL = "https://t.me/DarWeb_DZ";

export function Header({ tokenCount, lastScan, onManualScan, isScanning, nextScanIn }: HeaderProps) {
  const { toast } = useToast();

  const copyDonationAddress = () => {
    navigator.clipboard.writeText(DONATION_ADDRESS);
    toast({ description: "Donation address copied!" });
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            {/* Social Links */}
            <div className="hidden sm:flex items-center gap-1">
              <a
                href={TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted/50 hover:bg-foreground hover:text-background transition-all duration-200"
                data-testid="link-header-twitter"
              >
                <FaXTwitter className="w-5 h-5" />
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted/50 hover:bg-[#0088cc] hover:text-white transition-all duration-200"
                data-testid="link-header-telegram"
              >
                <FaTelegram className="w-5 h-5" />
              </a>
            </div>
            
            <ThemeSwitcher />
            
            <Button
              variant="outline"
              size="sm"
              onClick={onManualScan}
              disabled={isScanning}
              className="border-primary/50 hover:bg-primary/10"
              data-testid="button-scan-now"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : nextScanIn ? `Next: ${formatCountdown(nextScanIn)}` : 'Scan Now'}
            </Button>
          </div>
        </div>
        
        {/* Donation Bar */}
        <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Donate SOL:</span>
          <code className="text-xs font-mono text-primary bg-muted/50 px-2 py-0.5 rounded">
            {DONATION_ADDRESS.slice(0, 8)}...{DONATION_ADDRESS.slice(-6)}
          </code>
          <button
            onClick={copyDonationAddress}
            className="p-1 hover:text-primary transition-colors"
            data-testid="button-copy-donation"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
}
