import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { ThemeProvider } from "@/components/theme-provider";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import ArticlePage from "./pages/ArticlePage";
import TradingBot from "./pages/TradingBot";
import NotFound from "./pages/NotFound";

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Switch>
          <Route path="/" component={Index} />
          <Route path="/ctrl-x7k9m2p4q8" component={Admin} />
          <Route path="/articles/:slug" component={ArticlePage} />
          <Route path="/bot" component={TradingBot} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
