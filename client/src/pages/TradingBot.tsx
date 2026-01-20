import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
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
  LogOut,
  Plus,
  Copy,
  Trash2,
  Info,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SiSolana } from "react-icons/si";

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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
  const [privateKey, setPrivateKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [session, setSession] = useState<BotSession | null>(null);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [targetToken, setTargetToken] = useState("");
  const [buyAmount, setBuyAmount] = useState("0.1");
  const [slippage, setSlippage] = useState("15");
  const [autoSell, setAutoSell] = useState(true);
  const [takeProfit, setTakeProfit] = useState("50");
  const [stopLoss, setStopLoss] = useState("30");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isGeneratedWallet, setIsGeneratedWallet] = useState(false);
  const [generatedKeyVisible, setGeneratedKeyVisible] = useState(false);
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState("");

  const { data: botSettings } = useQuery<BotSettings>({
    queryKey: ["/api/bot/settings"],
  });

  const { data: trades, refetch: refetchTrades } = useQuery<BotTrade[]>({
    queryKey: ["/api/bot/trades", session?.sessionId],
    enabled: !!session?.sessionId,
    refetchInterval: 5000,
  });

  const connectWalletMutation = useMutation({
    mutationFn: async (pk: string) => {
      const res = await fetch("/api/bot/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privateKey: pk }),
      });
      if (!res.ok) throw new Error("Failed to connect wallet");
      return res.json();
    },
    onSuccess: (data) => {
      setSession(data.session);
      localStorage.setItem("bot_session_id", data.session.sessionId);
      if (!generatedKeyVisible) {
        setIsGeneratedWallet(false);
        localStorage.removeItem("is_generated_wallet");
      }
      setGeneratedKeyVisible(false);
      toast({ description: "Wallet connected successfully!" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        description: "Failed to connect wallet",
      });
    },
  });

  const executeTradeMutation = useMutation({
    mutationFn: async (params: {
      type: "buy" | "sell";
      tokenAddress: string;
      amount: string;
    }) => {
      const res = await fetch("/api/bot/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session?.sessionId,
          ...params,
          slippage,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Trade failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/session"] });
      toast({ description: data.message || "Trade executed successfully!" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", description: error.message });
    },
  });

  const sellMutation = useMutation({
    mutationFn: async (params: {
      tokenAddress: string;
      percentage?: number;
    }) => {
      const res = await fetch("/api/bot/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session?.sessionId,
          ...params,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Sell failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/session"] });
      toast({ description: data.message || "Sold successfully!" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", description: error.message });
    },
  });

  useEffect(() => {
    const savedSessionId = localStorage.getItem("bot_session_id");
    const savedIsGenerated = localStorage.getItem("is_generated_wallet");
    if (savedSessionId) {
      fetch(`/api/bot/session/${savedSessionId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.session) {
            setSession(data.session);
            if (savedIsGenerated === "true") {
              setIsGeneratedWallet(true);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleConnect = () => {
    if (!privateKey.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter your private key",
      });
      return;
    }
    setIsConnecting(true);
    connectWalletMutation.mutate(privateKey, {
      onSettled: () => setIsConnecting(false),
    });
  };

  const handleLogoutClick = () => {
    if (isGeneratedWallet) {
      setShowLogoutDialog(true);
    } else {
      performLogout(false);
    }
  };

  const performLogout = (deleteWallet: boolean) => {
    if (deleteWallet && session?.sessionId) {
      fetch(`/api/bot/session/${session.sessionId}`, {
        method: "DELETE",
      }).catch(() => {});
    }
    setSession(null);
    setPrivateKey("");
    setGeneratedPrivateKey("");
    setIsGeneratedWallet(false);
    setGeneratedKeyVisible(false);
    localStorage.removeItem("bot_session_id");
    localStorage.removeItem("is_generated_wallet");
    setShowLogoutDialog(false);
    toast({
      description: deleteWallet
        ? "Wallet deleted and disconnected"
        : "Wallet disconnected",
    });
  };

  const generateNewWallet = async () => {
    try {
      const res = await fetch("/api/bot/generate-wallet", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate wallet");
      const data = await res.json();
      setGeneratedPrivateKey(data.privateKey);
      setPrivateKey(data.privateKey);
      setGeneratedKeyVisible(true);
      setIsGeneratedWallet(true);
      localStorage.setItem("is_generated_wallet", "true");
      toast({
        description:
          "New wallet generated! Save your private key before proceeding.",
      });
    } catch {
      toast({
        variant: "destructive",
        description: "Failed to generate wallet",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Copied to clipboard!" });
  };

  const handleBuy = () => {
    if (!targetToken.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter token address",
      });
      return;
    }
    executeTradeMutation.mutate({
      type: "buy",
      tokenAddress: targetToken,
      amount: buyAmount,
    });
  };

  const netProfit = session
    ? parseFloat(session.totalProfitSOL || "0") -
      parseFloat(session.totalLossSOL || "0")
    : 0;

  if (!botSettings?.isEnabled) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Bot Temporarily Disabled
            </h2>
            <p className="text-muted-foreground">
              The trading bot is currently disabled by the administrator. Please
              check back later.
            </p>
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
                  <p className="text-xs text-muted-foreground">
                    Jito MEV Protected Trading
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {botSettings?.isFree ? (
                <Badge
                  variant="outline"
                  className="text-green-500 border-green-500"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  FREE
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-yellow-500 border-yellow-500"
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  {botSettings?.subscriptionPriceSOL} SOL/month
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-blue-500 border-blue-500"
              >
                <Percent className="w-3 h-3 mr-1" />
                {botSettings?.profitSharePercent}% Profit Share
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!session ? (
          <div className="max-w-lg mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Connect Wallet
                </CardTitle>
                <CardDescription>
                  Enter your Solana wallet private key to start trading. Your
                  key is encrypted and stored securely.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-500">
                        Security Warning
                      </p>
                      <p className="text-muted-foreground">
                        Never share your private key. Use a dedicated trading
                        wallet with limited funds.
                      </p>
                    </div>
                  </div>
                </div>

                {generatedKeyVisible && generatedPrivateKey && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm flex-1">
                        <p className="font-medium text-green-500 mb-2">
                          Wallet Generated Successfully!
                        </p>
                        <p className="text-muted-foreground mb-2">
                          Save this private key securely. You will need it to
                          access your wallet later.
                        </p>
                        <div className="flex items-center gap-2 p-2 bg-background rounded border">
                          <code className="text-xs flex-1 break-all">
                            {generatedPrivateKey}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(generatedPrivateKey)}
                            data-testid="button-copy-key"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={generateNewWallet}
                  className="w-full"
                  data-testid="button-generate-wallet"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Wallet
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-500">
                  <Info className="w-5 h-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <p>
                    <strong>Connect or Generate:</strong> Use your existing
                    wallet or generate a new one. Send SOL to the wallet address
                    to fund it.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <p>
                    <strong>Quick Snipe:</strong> Enter a token address and
                    click BUY. Trades are executed instantly using Jito MEV
                    protection.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs flex-shrink-0">
                    3
                  </div>
                  <p>
                    <strong>Sell Anytime:</strong> Click "Sell All" on any
                    completed buy trade to sell your tokens back to SOL.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold text-xs flex-shrink-0">
                    !
                  </div>
                  <p>
                    <strong>Commission:</strong> We only take{" "}
                    {botSettings?.profitSharePercent || 5}% of your profits. No
                    profit = no fee.
                  </p>
                </div>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogoutClick}
                      data-testid="button-disconnect"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">Address</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(session.walletAddress)}
                          className="h-6 w-6"
                          title="Copy address"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="font-mono text-sm truncate">
                        {session.walletAddress}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-lg font-bold">
                        {parseFloat(session.currentBalanceSOL || "0").toFixed(
                          4,
                        )}{" "}
                        SOL
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Net P/L</p>
                      <p
                        className={`text-lg font-bold ${netProfit >= 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {netProfit >= 0 ? "+" : ""}
                        {netProfit.toFixed(4)} SOL
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        Commission Paid
                      </p>
                      <p className="text-lg font-bold text-yellow-500">
                        {parseFloat(session.commissionPaidSOL || "0").toFixed(
                          4,
                        )}{" "}
                        SOL
                      </p>
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
                  {parseFloat(session?.currentBalanceSOL || "0") <
                    parseFloat(buyAmount) && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500">
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      Insufficient balance. You need at least {buyAmount} SOL to
                      execute this trade.
                    </div>
                  )}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleBuy}
                      className="flex-1 bg-green-600"
                      disabled={
                        executeTradeMutation.isPending ||
                        parseFloat(session?.currentBalanceSOL || "0") <
                          parseFloat(buyAmount) ||
                        parseFloat(session?.currentBalanceSOL || "0") <= 0
                      }
                      data-testid="button-buy"
                    >
                      {executeTradeMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TrendingUp className="w-4 h-4 mr-2" />
                      )}
                      {parseFloat(session?.currentBalanceSOL || "0") <= 0
                        ? "No Balance"
                        : "BUY with Jito"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Trade History
                    <Badge variant="outline" className="ml-auto">
                      {trades?.length || 0} trades
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {trades && trades.length > 0 ? (
                      <div className="space-y-3">
                        {trades.map((trade) => {
                          const pnl = parseFloat(trade.profitLossSOL || "0");
                          const isProfitable = pnl > 0;
                          const isLoss = pnl < 0;
                          const isBuy = trade.tradeType === "buy";
                          const tradeTime = new Date(trade.createdAt);
                          const timeAgo = getTimeAgo(tradeTime);

                          return (
                            <div
                              key={trade.id}
                              className={`p-4 rounded-lg border ${
                                trade.status === "completed"
                                  ? isProfitable
                                    ? "border-green-500/30 bg-green-500/5"
                                    : isLoss
                                      ? "border-red-500/30 bg-red-500/5"
                                      : "border-border bg-muted/30"
                                  : trade.status === "pending"
                                    ? "border-yellow-500/30 bg-yellow-500/5"
                                    : "border-red-500/30 bg-red-500/5"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      isBuy
                                        ? "bg-green-500/20 text-green-500"
                                        : "bg-red-500/20 text-red-500"
                                    }`}
                                  >
                                    {isBuy ? (
                                      <TrendingUp className="w-5 h-5" />
                                    ) : (
                                      <TrendingDown className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-lg">
                                        {trade.tokenSymbol || "Unknown"}
                                      </span>
                                      <Badge
                                        variant={
                                          isBuy ? "default" : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {trade.tradeType.toUpperCase()}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          trade.status === "completed"
                                            ? "text-green-500 border-green-500"
                                            : trade.status === "pending"
                                              ? "text-yellow-500 border-yellow-500"
                                              : "text-red-500 border-red-500"
                                        }`}
                                      >
                                        {trade.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {trade.tokenName || "Unknown Token"}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[250px]">
                                      {trade.tokenAddress}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {timeAgo}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  <p className="font-bold text-lg">
                                    {parseFloat(trade.amountSOL).toFixed(4)} SOL
                                  </p>
                                  {trade.amountTokens && (
                                    <p className="text-sm text-muted-foreground">
                                      {parseFloat(
                                        trade.amountTokens,
                                      ).toLocaleString()}{" "}
                                      tokens
                                    </p>
                                  )}
                                  {trade.status === "completed" &&
                                    pnl !== 0 && (
                                      <p
                                        className={`font-semibold ${isProfitable ? "text-green-500" : "text-red-500"}`}
                                      >
                                        {isProfitable ? "+" : ""}
                                        {pnl.toFixed(4)} SOL
                                      </p>
                                    )}
                                  {trade.commissionSOL &&
                                    parseFloat(trade.commissionSOL) > 0 && (
                                      <p className="text-xs text-yellow-500">
                                        Fee:{" "}
                                        {parseFloat(
                                          trade.commissionSOL,
                                        ).toFixed(4)}{" "}
                                        SOL
                                      </p>
                                    )}
                                  {trade.txSignature && (
                                    <a
                                      href={`https://solscan.io/tx/${trade.txSignature}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 hover:underline"
                                    >
                                      View TX
                                    </a>
                                  )}
                                  {isBuy && trade.status === "completed" && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        sellMutation.mutate({
                                          tokenAddress: trade.tokenAddress,
                                        })
                                      }
                                      disabled={sellMutation.isPending}
                                      className="mt-2"
                                      data-testid={`button-sell-${trade.id}`}
                                    >
                                      {sellMutation.isPending ? (
                                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                      ) : (
                                        <TrendingDown className="w-3 h-3 mr-1" />
                                      )}
                                      Sell All
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No trades yet</p>
                        <p className="text-sm mt-2">
                          Enter a token address and click BUY to start trading
                        </p>
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
                    <span className="text-sm text-muted-foreground">
                      Auto Sniper
                    </span>
                    <Badge variant={isBotRunning ? "default" : "secondary"}>
                      {isBotRunning ? "Running" : "Stopped"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Jito Bundle
                    </span>
                    <Badge
                      variant="outline"
                      className="text-green-500 border-green-500"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      MEV Protection
                    </span>
                    <Badge
                      variant="outline"
                      className="text-green-500 border-green-500"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Enabled
                    </Badge>
                  </div>
                  <Button
                    className="w-full"
                    variant={isBotRunning ? "destructive" : "default"}
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
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <p className="font-medium mb-1">What is Auto Sniper?</p>
                    <p>
                      When enabled, the bot automatically monitors new tokens
                      from the scanner and buys them instantly using Jito MEV
                      protection. Configure your buy amount and slippage
                      settings above before starting.
                    </p>
                  </div>
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
                    <span className="text-muted-foreground">
                      Default Slippage
                    </span>
                    <span>{botSettings?.defaultSlippagePercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jito Tip</span>
                    <span>
                      {(botSettings?.jitoTipLamports || 0) / 1000000} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit Share</span>
                    <span className="text-yellow-500">
                      {botSettings?.profitSharePercent}%
                    </span>
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
                    We only take{" "}
                    <span className="text-primary font-bold">
                      {botSettings?.profitSharePercent}%
                    </span>{" "}
                    commission on profits.
                  </p>
                  <p className="text-muted-foreground">
                    If you lose money, you pay{" "}
                    <span className="text-green-500 font-bold">NOTHING</span>.
                  </p>
                  <div className="p-3 bg-primary/10 rounded-lg mt-4">
                    <p className="text-xs">
                      Commission is calculated on profits above your initial
                      investment only.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Disconnect Wallet
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This wallet was generated on this site. What would you like to
                do with it?
              </p>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                <p className="text-yellow-500 font-medium">Important:</p>
                <p className="text-muted-foreground">
                  If you delete the wallet, all funds in it will be lost. Make
                  sure to withdraw any remaining balance first.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => setShowLogoutDialog(false)}
              data-testid="button-cancel-logout"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => performLogout(false)}
              data-testid="button-keep-wallet"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keep Wallet & Disconnect
            </Button>
            <Button
              variant="destructive"
              onClick={() => performLogout(true)}
              data-testid="button-delete-wallet"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Wallet
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
