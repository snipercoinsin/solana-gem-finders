import { pgTable, text, varchar, integer, boolean, numeric, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const verifiedTokens = pgTable("verified_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenName: text("token_name").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  contractAddress: text("contract_address").notNull().unique(),
  chain: text("chain").notNull().default("solana"),
  launchTime: timestamp("launch_time", { withTimezone: true }).notNull(),
  currentPrice: numeric("current_price"),
  marketCap: numeric("market_cap"),
  liquidityUsd: numeric("liquidity_usd"),
  volume24h: numeric("volume_24h"),
  liquidityLocked: boolean("liquidity_locked").default(false),
  liquidityLockDurationMonths: integer("liquidity_lock_duration_months"),
  ownershipRenounced: boolean("ownership_renounced").default(false),
  contractVerified: boolean("contract_verified").default(false),
  honeypotSafe: boolean("honeypot_safe").default(false),
  buyTax: numeric("buy_tax"),
  sellTax: numeric("sell_tax"),
  safetyScore: integer("safety_score").default(0),
  dexscreenerUrl: text("dexscreener_url"),
  solscanUrl: text("solscan_url"),
  rugcheckUrl: text("rugcheck_url"),
  twitterUrl: text("twitter_url"),
  telegramUrl: text("telegram_url"),
  websiteUrl: text("website_url"),
  safetyReasons: text("safety_reasons").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scanLogs = pgTable("scan_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  scanType: text("scan_type").notNull(),
  tokensScanned: integer("tokens_scanned").default(0),
  tokensPassed: integer("tokens_passed").default(0),
  tokensFailed: integer("tokens_failed").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const failedTokens = pgTable("failed_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenName: text("token_name"),
  tokenSymbol: text("token_symbol"),
  contractAddress: text("contract_address").notNull(),
  failureReasons: text("failure_reasons").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteAds = pgTable("site_ads", {
  id: uuid("id").defaultRandom().primaryKey(),
  position: text("position").notNull(),
  contentType: text("content_type").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVerifiedTokenSchema = createInsertSchema(verifiedTokens).omit({ id: true, createdAt: true, updatedAt: true });
export const insertScanLogSchema = createInsertSchema(scanLogs).omit({ id: true, createdAt: true });
export const insertFailedTokenSchema = createInsertSchema(failedTokens).omit({ id: true, createdAt: true });
export const insertSiteAdSchema = createInsertSchema(siteAds).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertVerifiedToken = z.infer<typeof insertVerifiedTokenSchema>;
export type InsertScanLog = z.infer<typeof insertScanLogSchema>;
export type InsertFailedToken = z.infer<typeof insertFailedTokenSchema>;
export type InsertSiteAd = z.infer<typeof insertSiteAdSchema>;

export type VerifiedToken = typeof verifiedTokens.$inferSelect;
export type ScanLog = typeof scanLogs.$inferSelect;
export type FailedToken = typeof failedTokens.$inferSelect;
export type SiteAd = typeof siteAds.$inferSelect;
