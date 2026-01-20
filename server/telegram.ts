import TelegramBot from "node-telegram-bot-api";

interface TokenInfo {
  tokenName: string;
  tokenSymbol: string;
  contractAddress: string;
  currentPrice: string | null;
  marketCap: string | null;
  liquidityUsd: string | null;
  volume24h: string | null;
  safetyScore: number;
  priceChange24h: string | null;
  imageUrl: string | null;
  dexscreenerUrl: string | null;
  solscanUrl: string | null;
  rugcheckUrl: string | null;
  twitterUrl: string | null;
  telegramUrl: string | null;
  websiteUrl: string | null;
  safetyReasons: string[];
  ownershipRenounced: boolean;
  liquidityLocked: boolean;
  honeypotSafe: boolean;
}

class TelegramService {
  private bot: TelegramBot | null = null;
  private channelId: string | null = null;
  private isInitialized = false;

  initialize() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID;

    if (!token || !channelId) {
      console.log(
        "[TELEGRAM] Bot token or channel ID not configured. Telegram notifications disabled.",
      );
      return false;
    }

    try {
      this.bot = new TelegramBot(token, { polling: false });
      this.channelId = channelId;
      this.isInitialized = true;
      console.log("[TELEGRAM] Bot initialized successfully");
      return true;
    } catch (error) {
      console.error("[TELEGRAM] Failed to initialize bot:", error);
      return false;
    }
  }

  private formatNumber(num: string | number | null): string {
    if (!num) return "N/A";
    const n = typeof num === "string" ? parseFloat(num) : num;
    if (isNaN(n)) return "N/A";

    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  }

  private formatPrice(price: string | null): string {
    if (!price) return "N/A";
    const p = parseFloat(price);
    if (isNaN(p)) return "N/A";
    if (p < 0.0001) return `$${p.toExponential(2)}`;
    return `$${p.toFixed(6)}`;
  }

  async sendNewTokenAlert(token: TokenInfo): Promise<boolean> {
    if (!this.isInitialized || !this.bot || !this.channelId) {
      return false;
    }

    try {
      const priceChange = token.priceChange24h
        ? parseFloat(token.priceChange24h)
        : null;
      const priceChangeStr =
        priceChange !== null
          ? `${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)}%`
          : "N/A";
      const priceChangeIndicator =
        priceChange !== null ? (priceChange >= 0 ? "[UP]" : "[DOWN]") : "";

      const safetyIndicator =
        token.safetyScore >= 75
          ? "[SAFE]"
          : token.safetyScore >= 50
            ? "[CAUTION]"
            : "[RISK]";

      let message = `--- NEW TOKEN VERIFIED ---\n\n`;
      message += `*${token.tokenSymbol}* - ${token.tokenName}\n\n`;
      message += `${safetyIndicator} Safety Score: *${token.safetyScore}%*\n\n`;
      message += `Price: ${this.formatPrice(token.currentPrice)} ${priceChangeIndicator} ${priceChangeStr}\n`;
      message += `Market Cap: ${this.formatNumber(token.marketCap)}\n`;
      message += `Liquidity: ${this.formatNumber(token.liquidityUsd)}\n`;
      message += `24h Volume: ${this.formatNumber(token.volume24h)}\n\n`;

      message += `*Safety Analysis:*\n`;
      if (token.ownershipRenounced)
        message += `[OK] Mint and freeze authority renounced\n`;
      if (token.liquidityLocked) message += `[OK] 100% liquidity locked\n`;
      if (token.honeypotSafe)
        message += `[OK] No high-risk indicators detected\n`;
      message += `\n`;

      message += `*Contract:*\n\`${token.contractAddress}\`\n\n`;

      message += `*Links:*\n`;
      const links: string[] = [];
      if (token.dexscreenerUrl)
        links.push(`[Dexscreener](${token.dexscreenerUrl})`);
      if (token.solscanUrl) links.push(`[Solscan](${token.solscanUrl})`);
      if (token.rugcheckUrl) links.push(`[RugCheck](${token.rugcheckUrl})`);
      if (token.twitterUrl) links.push(`[Twitter](${token.twitterUrl})`);
      if (token.telegramUrl) links.push(`[Telegram](${token.telegramUrl})`);
      if (token.websiteUrl) links.push(`[Website](${token.websiteUrl})`);
      message += links.join(" | ");

      message += `\n\n_Powered by Solana Scanner_`;

      if (token.imageUrl) {
        await this.bot.sendPhoto(this.channelId, token.imageUrl, {
          caption: message,
          parse_mode: "Markdown",
        });
      } else {
        await this.bot.sendMessage(this.channelId, message, {
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        });
      }

      console.log(`[TELEGRAM] Sent alert for ${token.tokenSymbol}`);
      return true;
    } catch (error) {
      console.error("[TELEGRAM] Failed to send token alert:", error);
      return false;
    }
  }

  async sendScanSummary(
    scanned: number,
    passed: number,
    failed: number,
  ): Promise<boolean> {
    if (!this.isInitialized || !this.bot || !this.channelId) {
      return false;
    }

    try {
      const message =
        `--- Scan Complete ---\n\n` +
        `Tokens Scanned: ${scanned}\n` +
        `Passed: ${passed}\n` +
        `Failed: ${failed}\n\n` +
        `_${new Date().toLocaleString()}_`;

      await this.bot.sendMessage(this.channelId, message, {
        parse_mode: "Markdown",
      });

      return true;
    } catch (error) {
      console.error("[TELEGRAM] Failed to send scan summary:", error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isInitialized || !this.bot || !this.channelId) {
      return false;
    }

    try {
      await this.bot.sendMessage(
        this.channelId,
        "*Solana Scanner Bot Connected*\n\nYou will receive real-time token alerts here.",
        { parse_mode: "Markdown" },
      );
      return true;
    } catch (error) {
      console.error("[TELEGRAM] Connection test failed:", error);
      return false;
    }
  }
}

export const telegramService = new TelegramService();
