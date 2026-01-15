import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractAddress: string;
  tokenSymbol: string;
}

export function ChartDialog({ open, onOpenChange, contractAddress, tokenSymbol }: ChartDialogProps) {
  const embedUrl = `https://dexscreener.com/solana/${contractAddress}?embed=1&theme=dark&trades=0&info=0`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[80vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            {tokenSymbol} Chart
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-full min-h-[500px] p-4 pt-2">
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg border border-border"
            title={`${tokenSymbol} Chart`}
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
