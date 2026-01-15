import { Activity, RefreshCw, Copy, Zap } from 'lucide-react';
import { FaXTwitter, FaTelegram } from 'react-icons/fa6';
import { SiSolana } from 'react-icons/si';
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
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#14F195] to-[#9945FF]">
              <Zap className="w-6 h-6 text-black" />
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
            {/* Social Links & Donate */}
            <div className="hidden sm:flex items-center gap-1">
              <button 
                onClick={copyDonationAddress}
                className="flex items-center gap-1 px-2 py-1 text-[#14F195] text-xs font-medium rounded hover:bg-transparent active:scale-95 transition-transform"
                data-testid="button-copy-donation"
              >
                <Copy className="w-3 h-3" />
                <span>Donate</span>
                <SiSolana className="w-3.5 h-3.5" />
              </button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={TWITTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-header-twitter"
                >
                  <FaXTwitter className="w-5 h-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500"
                  data-testid="link-header-telegram"
                >
                  <FaTelegram className="w-5 h-5" />
                </a>
              </Button>
            </div>
            
            <ThemeSwitcher />
            
            <Button
              variant="outline"
              size="sm"
              onClick={onManualScan}
              disabled={isScanning}
              className="border-primary/50"
              data-testid="button-scan-now"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : nextScanIn ? `Next: ${formatCountdown(nextScanIn)}` : 'Scan Now'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
