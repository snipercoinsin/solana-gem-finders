import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  Wallet,
  Bot,
  TrendingUp,
  TrendingDown,
  Settings,
  History,
  Play,
  Pause,
  RefreshCw,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Rocket,
  Target,
  Percent,
} from 'lucide-react';
import { SiSolana } from 'react-icons/si';

interface BotSettings {
  id: string;
  isEnabled: boolean;
  isFree: boolean;
  subscriptionPriceSOL: string;
  profitSharePercent: string;
  minBuyAmountSOL: string;
  maxBuyAmountSOL: string;
  defaultSlippagePercent: string;
  jitoTipLamports: number;
  autoSellEnabled: boolean;
  takeProfitPercent: string;
  stopLossPercent: string;
}

interface BotSession {
  id: string;
  sessionId: string;
  walletAddress: string;
  initialBalanceSOL: string;
  currentBalanceSOL: string;
  totalProfitSOL: string;
  totalLossSOL: string;
  commissionPaidSOL: string;
  isActive: boolean;
}

interface BotTrade {
  id: string;
  sessionId: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tradeType: string;
  amountSOL: string;
  amountTokens: string;
  pricePerToken: string;
  txSignature: string;
  status: string;
  profitLossSOL: string;
  commissionSOL: string;
  createdAt: string;
}

export default function TradingBot() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [privateKey, setPrivateKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [session, setSession] = useState<BotSession | null>(null);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [targetToken, setTargetToken] = useState('');
  const [buyAmount, setBuyAmount] = useState('0.1');
  const [slippage, setSlippage] = useState('15');
  const [autoSell, setAutoSell] = useState(true);
  const [takeProfit, setTakeProfit] = useState('50');
  const [stopLoss, setStopLoss] = useState('30');

  const { data: botSettings } = useQuery<BotSettings>({
    queryKey: ['/api/bot/settings'],
  });

  const { data: trades } = useQuery<BotTrade[]>({
    queryKey: ['/api/bot/trades', session?.sessionId],
    enabled: !!session?.sessionId,
  });

  const connectWalletMutation = useMutation({
    mutationFn: async (pk: string) => {
      const res = await fetch('/api/bot/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey: pk }),
      });
      if (!res.ok) throw new Error('Failed to connect wallet');
      return res.json();
    },
    onSuccess: (data) => {
      setSession(data.session);
      localStorage.setItem('bot_session_id', data.session.sessionId);
      toast({ description: 'Wallet connected successfully!' });
    },
    onError: () => {
      toast({ variant: 'destructive', description: 'Failed to connect wallet' });
    },
  });

  const executeTradeMutation = useMutation({
    mutationFn: async (params: { type: 'buy' | 'sell'; tokenAddress: string; amount: string }) => {
      const res = await fetch('/api/bot/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.sessionId,
          ...params,
          slippage,
        }),
      });
      if (!res.ok) throw new Error('Trade failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/trades'] });
      toast({ description: 'Trade executed successfully!' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', description: error.message });
    },
  });

  useEffect(() => {
    const savedSessionId = localStorage.getItem('bot_session_id');
    if (savedSessionId) {
      fetch(`/api/bot/session/${savedSessionId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.session) setSession(data.session);
        })
        .catch(() => {});
    }
  }, []);

  const handleConnect = () => {
    if (!privateKey.trim()) {
      toast({ variant: 'destructive', description: 'Please enter your private key' });
      return;
    }
    setIsConnecting(true);
    connectWalletMutation.mutate(privateKey, {
      onSettled: () => setIsConnecting(false),
    });
  };

  const handleDisconnect = () => {
    setSession(null);
    setPrivateKey('');
    localStorage.removeItem('bot_session_id');
    toast({ description: 'Wallet disconnected' });
  };

  const handleBuy = () => {
    if (!targetToken.trim()) {
      toast({ variant: 'destructive', description: 'Please enter token address' });
      return;
    }
    executeTradeMutation.mutate({
      type: 'buy',
      tokenAddress: targetToken,
      amount: buyAmount,
    });
  };

  const netProfit = session 
    ? parseFloat(session.totalProfitSOL || '0') - parseFloat(session.totalLossSOL || '0')
    : 0;

  if (!botSettings?.isEnabled) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Bot Temporarily Disabled</h2>
            <p className="text-muted-foreground">The trading bot is currently disabled by the administrator. Please check back later.</p>
            <Link href="/">
              <Button className="mt-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scanner
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Bot className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Sniper Bot</h1>
                  <p className="text-xs text-muted-foreground">Jito MEV Protected Trading</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {botSettings?.isFree ? (
                <Badge variant="outline" className="text-green-500 border-green-500">
                  <Zap className="w-3 h-3 mr-1" />
                  FREE
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {botSettings?.subscriptionPriceSOL} SOL/month
                </Badge>
              )}
              <Badge variant="outline" className="text-blue-500 border-blue-500">
                <Percent className="w-3 h-3 mr-1" />
                {botSettings?.profitSharePercent}% Profit Share
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!session ? (
          <div className="max-w-lg mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Connect Wallet
                </CardTitle>
                <CardDescription>
                  Enter your Solana wallet private key to start trading. Your key is encrypted and stored securely.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-500">Security Warning</p>
                      <p className="text-muted-foreground">Never share your private key. Use a dedicated trading wallet with limited funds.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Private Key (Base58)</Label>
                  <Input
                    type="password"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter your private key..."
                    className="font-mono"
                    data-testid="input-private-key"
                  />
                </div>
                <Button 
                  onClick={handleConnect} 
                  className="w-full" 
                  disabled={isConnecting}
                  data-testid="button-connect-wallet"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wallet className="w-4 h-4 mr-2" />
                  )}
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <SiSolana className="w-5 h-5 text-violet-500" />
                      Wallet Balance
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-mono text-sm truncate">{session.walletAddress}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-lg font-bold">{parseFloat(session.currentBalanceSOL || '0').toFixed(4)} SOL</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Net P/L</p>
                      <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(4)} SOL
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Commission Paid</p>
                      <p className="text-lg font-bold text-yellow-500">{parseFloat(session.commissionPaidSOL || '0').toFixed(4)} SOL</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    Quick Snipe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Token Address</Label>
                      <Input
                        value={targetToken}
                        onChange={(e) => setTargetToken(e.target.value)}
                        placeholder="Enter token contract address..."
                        className="font-mono"
                        data-testid="input-token-address"
                      />
                    </div>
                    <div>
                      <Label>Buy Amount (SOL)</Label>
                      <Input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        min={botSettings?.minBuyAmountSOL}
                        max={botSettings?.maxBuyAmountSOL}
                        step="0.01"
                        data-testid="input-buy-amount"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Slippage %</Label>
                      <Input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        min="1"
                        max="50"
                        data-testid="input-slippage"
                      />
                    </div>
                    <div>
                      <Label>Take Profit %</Label>
                      <Input
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        min="10"
                        max="500"
                        disabled={!autoSell}
                        data-testid="input-take-profit"
                      />
                    </div>
                    <div>
                      <Label>Stop Loss %</Label>
                      <Input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        min="5"
                        max="90"
                        disabled={!autoSell}
                        data-testid="input-stop-loss"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Auto Sell (TP/SL)</span>
                    </div>
                    <Switch
                      checked={autoSell}
                      onCheckedChange={setAutoSell}
                      data-testid="switch-auto-sell"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleBuy}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={executeTradeMutation.isPending}
                      data-testid="button-buy"
                    >
                      {executeTradeMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TrendingUp className="w-4 h-4 mr-2" />
                      )}
                      BUY with Jito
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Trade History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {trades && trades.length > 0 ? (
                      <div className="space-y-2">
                        {trades.map((trade) => (
                          <div 
                            key={trade.id} 
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant={trade.tradeType === 'buy' ? 'default' : 'secondary'}>
                                {trade.tradeType.toUpperCase()}
                              </Badge>
                              <div>
                                <p className="font-medium">{trade.tokenSymbol || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                                  {trade.tokenAddress}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{parseFloat(trade.amountSOL).toFixed(4)} SOL</p>
                              {trade.profitLossSOL && (
                                <p className={`text-xs ${parseFloat(trade.profitLossSOL) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {parseFloat(trade.profitLossSOL) >= 0 ? '+' : ''}{parseFloat(trade.profitLossSOL).toFixed(4)} SOL
                                </p>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {trade.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No trades yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Bot Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Auto Sniper</span>
                    <Badge variant={isBotRunning ? 'default' : 'secondary'}>
                      {isBotRunning ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Jito Bundle</span>
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">MEV Protection</span>
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      <Shield className="w-3 h-3 mr-1" />
                      Enabled
                    </Badge>
                  </div>
                  <Button 
                    className="w-full"
                    variant={isBotRunning ? 'destructive' : 'default'}
                    onClick={() => setIsBotRunning(!isBotRunning)}
                    data-testid="button-toggle-bot"
                  >
                    {isBotRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Stop Auto Sniper
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Auto Sniper
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Bot Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Buy</span>
                    <span>{botSettings?.minBuyAmountSOL} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Buy</span>
                    <span>{botSettings?.maxBuyAmountSOL} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Slippage</span>
                    <span>{botSettings?.defaultSlippagePercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jito Tip</span>
                    <span>{(botSettings?.jitoTipLamports || 0) / 1000000} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit Share</span>
                    <span className="text-yellow-500">{botSettings?.profitSharePercent}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <DollarSign className="w-5 h-5" />
                    Commission Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p className="text-muted-foreground">
                    We only take <span className="text-primary font-bold">{botSettings?.profitSharePercent}%</span> commission on profits.
                  </p>
                  <p className="text-muted-foreground">
                    If you lose money, you pay <span className="text-green-500 font-bold">NOTHING</span>.
                  </p>
                  <div className="p-3 bg-primary/10 rounded-lg mt-4">
                    <p className="text-xs">
                      Commission is calculated on profits above your initial investment only.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
