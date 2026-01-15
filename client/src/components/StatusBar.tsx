import { useScanLogs } from '@/hooks/useScanLogs';
import { formatTimeAgo } from '@/lib/formatters';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

export function StatusBar() {
  const { logs } = useScanLogs();
  const latestLog = logs[0];

  return (
    <div className="border-t border-border bg-card/30 py-2 px-4">
      <div className="container mx-auto flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-muted-foreground">System Status:</span>
            <span className="text-primary">ONLINE</span>
          </div>
          
          {latestLog && (
            <>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Last Scan:</span>
                <span className="text-foreground">{formatTimeAgo(latestLog.created_at)}</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                <span className="text-primary">{latestLog.tokens_passed}</span>
                <span className="text-muted-foreground">passed</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-destructive" />
                <span className="text-destructive">{latestLog.tokens_failed}</span>
                <span className="text-muted-foreground">failed</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Solana Network</span>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
}
