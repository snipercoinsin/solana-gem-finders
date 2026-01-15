import { db } from "./db";
import { 
  verifiedTokens, scanLogs, failedTokens, siteAds,
  adminUsers, featuredTokens, visitorStats, articles,
  botSettings, botUserSessions, botTrades
} from "@shared/schema";
import type { 
  InsertVerifiedToken, InsertScanLog, InsertFailedToken, InsertSiteAd,
  InsertAdminUser, InsertFeaturedToken, InsertVisitorStat, InsertArticle,
  InsertBotSettings, InsertBotUserSession, InsertBotTrade,
  VerifiedToken, ScanLog, FailedToken, SiteAd,
  AdminUser, FeaturedToken, VisitorStat, Article,
  BotSettings, BotUserSession, BotTrade
} from "@shared/schema";
import { eq, desc, sql, gte, and } from "drizzle-orm";

export interface IStorage {
  getVerifiedTokens(page: number, limit: number): Promise<{ tokens: VerifiedToken[]; total: number }>;
  getVerifiedTokenByContract(contractAddress: string): Promise<VerifiedToken | null>;
  createVerifiedToken(token: InsertVerifiedToken): Promise<VerifiedToken>;
  updateVerifiedToken(contractAddress: string, data: Partial<InsertVerifiedToken>): Promise<VerifiedToken | null>;
  
  getScanLogs(limit: number): Promise<ScanLog[]>;
  createScanLog(log: InsertScanLog): Promise<ScanLog>;
  
  createFailedToken(token: InsertFailedToken): Promise<FailedToken>;
  
  getSiteAds(): Promise<SiteAd[]>;
  getActiveSiteAds(): Promise<SiteAd[]>;
  createSiteAd(ad: InsertSiteAd): Promise<SiteAd>;
  updateSiteAd(id: string, data: Partial<InsertSiteAd>): Promise<SiteAd | null>;
  deleteSiteAd(id: string): Promise<boolean>;

  getAdminByUserId(userId: string): Promise<AdminUser | null>;
  getAllAdmins(): Promise<AdminUser[]>;
  createAdmin(data: InsertAdminUser): Promise<AdminUser>;
  deleteAdmin(id: string): Promise<boolean>;

  getFeaturedTokens(): Promise<FeaturedToken[]>;
  addFeaturedToken(data: InsertFeaturedToken): Promise<FeaturedToken>;
  removeFeaturedToken(id: string): Promise<boolean>;

  getAllAds(): Promise<SiteAd[]>;
  createAd(data: InsertSiteAd): Promise<SiteAd>;
  updateAd(id: string, data: Partial<InsertSiteAd>): Promise<SiteAd | null>;
  deleteAd(id: string): Promise<boolean>;

  getAllArticles(): Promise<Article[]>;
  getPublishedArticles(): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | null>;
  createArticle(data: InsertArticle): Promise<Article>;
  updateArticle(id: string, data: Partial<InsertArticle>): Promise<Article | null>;
  deleteArticle(id: string): Promise<boolean>;

  trackVisit(): Promise<void>;
  getVisitorStats(): Promise<{ today: number; week: number; month: number; year: number; total: number }>;
}

export class DatabaseStorage implements IStorage {
  async getVerifiedTokens(page: number, limit: number): Promise<{ tokens: VerifiedToken[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const [tokens, countResult] = await Promise.all([
      db.select().from(verifiedTokens)
        .orderBy(desc(verifiedTokens.launchTime))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(verifiedTokens),
    ]);
    
    return { 
      tokens, 
      total: Number(countResult[0]?.count || 0) 
    };
  }

  async getVerifiedTokenByContract(contractAddress: string): Promise<VerifiedToken | null> {
    const [token] = await db.select().from(verifiedTokens)
      .where(eq(verifiedTokens.contractAddress, contractAddress))
      .limit(1);
    return token || null;
  }

  async createVerifiedToken(token: InsertVerifiedToken): Promise<VerifiedToken> {
    const [created] = await db.insert(verifiedTokens).values(token).returning();
    return created;
  }

  async updateVerifiedToken(contractAddress: string, data: Partial<InsertVerifiedToken>): Promise<VerifiedToken | null> {
    const [updated] = await db.update(verifiedTokens)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(verifiedTokens.contractAddress, contractAddress))
      .returning();
    return updated || null;
  }

  async getScanLogs(limit: number): Promise<ScanLog[]> {
    return db.select().from(scanLogs)
      .orderBy(desc(scanLogs.createdAt))
      .limit(limit);
  }

  async createScanLog(log: InsertScanLog): Promise<ScanLog> {
    const [created] = await db.insert(scanLogs).values(log).returning();
    return created;
  }

  async createFailedToken(token: InsertFailedToken): Promise<FailedToken> {
    const [created] = await db.insert(failedTokens).values(token).returning();
    return created;
  }

  async getSiteAds(): Promise<SiteAd[]> {
    return db.select().from(siteAds).orderBy(desc(siteAds.createdAt));
  }

  async getActiveSiteAds(): Promise<SiteAd[]> {
    return db.select().from(siteAds)
      .where(eq(siteAds.isActive, true))
      .orderBy(desc(siteAds.createdAt));
  }

  async createSiteAd(ad: InsertSiteAd): Promise<SiteAd> {
    const [created] = await db.insert(siteAds).values(ad).returning();
    return created;
  }

  async updateSiteAd(id: string, data: Partial<InsertSiteAd>): Promise<SiteAd | null> {
    const [updated] = await db.update(siteAds)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(siteAds.id, id))
      .returning();
    return updated || null;
  }

  async deleteSiteAd(id: string): Promise<boolean> {
    const result = await db.delete(siteAds).where(eq(siteAds.id, id));
    return true;
  }

  // Admin management
  async getAdminByUserId(userId: string): Promise<AdminUser | null> {
    const [admin] = await db.select().from(adminUsers)
      .where(eq(adminUsers.userId, userId))
      .limit(1);
    return admin || null;
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    return db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
  }

  async createAdmin(data: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db.insert(adminUsers).values(data).returning();
    return admin;
  }

  async deleteAdmin(id: string): Promise<boolean> {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
    return true;
  }

  // Featured tokens
  async getFeaturedTokens(): Promise<FeaturedToken[]> {
    return db.select().from(featuredTokens)
      .where(eq(featuredTokens.isActive, true))
      .orderBy(featuredTokens.displayOrder);
  }

  async addFeaturedToken(data: InsertFeaturedToken): Promise<FeaturedToken> {
    const [token] = await db.insert(featuredTokens).values(data).returning();
    return token;
  }

  async removeFeaturedToken(id: string): Promise<boolean> {
    await db.delete(featuredTokens).where(eq(featuredTokens.id, id));
    return true;
  }

  // Ads management
  async getAllAds(): Promise<SiteAd[]> {
    return db.select().from(siteAds).orderBy(desc(siteAds.createdAt));
  }

  async createAd(data: InsertSiteAd): Promise<SiteAd> {
    const [ad] = await db.insert(siteAds).values(data).returning();
    return ad;
  }

  async updateAd(id: string, data: Partial<InsertSiteAd>): Promise<SiteAd | null> {
    const [updated] = await db.update(siteAds)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(siteAds.id, id))
      .returning();
    return updated || null;
  }

  async deleteAd(id: string): Promise<boolean> {
    await db.delete(siteAds).where(eq(siteAds.id, id));
    return true;
  }

  // Articles
  async getAllArticles(): Promise<Article[]> {
    return db.select().from(articles).orderBy(desc(articles.createdAt));
  }

  async getPublishedArticles(): Promise<Article[]> {
    return db.select().from(articles)
      .where(eq(articles.isPublished, true))
      .orderBy(desc(articles.publishedAt));
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const [article] = await db.select().from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.isPublished, true)))
      .limit(1);
    return article || null;
  }

  async createArticle(data: InsertArticle): Promise<Article> {
    const [article] = await db.insert(articles).values(data).returning();
    return article;
  }

  async updateArticle(id: string, data: Partial<InsertArticle>): Promise<Article | null> {
    const [updated] = await db.update(articles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return updated || null;
  }

  async deleteArticle(id: string): Promise<boolean> {
    await db.delete(articles).where(eq(articles.id, id));
    return true;
  }

  // Visitor tracking
  async trackVisit(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [existing] = await db.select().from(visitorStats)
      .where(eq(visitorStats.date, today))
      .limit(1);

    if (existing) {
      await db.update(visitorStats)
        .set({ 
          visitorCount: (existing.visitorCount || 0) + 1,
          pageViews: (existing.pageViews || 0) + 1
        })
        .where(eq(visitorStats.id, existing.id));
    } else {
      await db.insert(visitorStats).values({
        date: today,
        visitorCount: 1,
        pageViews: 1,
      });
    }
  }

  async getVisitorStats(): Promise<{ 
    today: number; 
    week: number; 
    month: number; 
    year: number; 
    total: number; 
  }> {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const [todayStats] = await db.select({ sum: sql<number>`COALESCE(SUM(visitor_count), 0)` })
      .from(visitorStats)
      .where(gte(visitorStats.date, today));

    const [weekStats] = await db.select({ sum: sql<number>`COALESCE(SUM(visitor_count), 0)` })
      .from(visitorStats)
      .where(gte(visitorStats.date, weekAgo));

    const [monthStats] = await db.select({ sum: sql<number>`COALESCE(SUM(visitor_count), 0)` })
      .from(visitorStats)
      .where(gte(visitorStats.date, monthAgo));

    const [yearStats] = await db.select({ sum: sql<number>`COALESCE(SUM(visitor_count), 0)` })
      .from(visitorStats)
      .where(gte(visitorStats.date, yearAgo));

    const [totalStats] = await db.select({ sum: sql<number>`COALESCE(SUM(visitor_count), 0)` })
      .from(visitorStats);

    return {
      today: Number(todayStats?.sum || 0),
      week: Number(weekStats?.sum || 0),
      month: Number(monthStats?.sum || 0),
      year: Number(yearStats?.sum || 0),
      total: Number(totalStats?.sum || 0),
    };
  }

  // Bot Settings
  async getBotSettings(): Promise<BotSettings | null> {
    const [settings] = await db.select().from(botSettings).limit(1);
    return settings || null;
  }

  async getOrCreateBotSettings(): Promise<BotSettings> {
    let [settings] = await db.select().from(botSettings).limit(1);
    if (!settings) {
      [settings] = await db.insert(botSettings).values({}).returning();
    }
    return settings;
  }

  async updateBotSettings(data: Partial<InsertBotSettings>): Promise<BotSettings> {
    const existing = await this.getOrCreateBotSettings();
    const [updated] = await db.update(botSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(botSettings.id, existing.id))
      .returning();
    return updated;
  }

  // Bot User Sessions
  async getBotSession(sessionId: string): Promise<BotUserSession | null> {
    const [session] = await db.select().from(botUserSessions)
      .where(eq(botUserSessions.sessionId, sessionId));
    return session || null;
  }

  async createBotSession(data: InsertBotUserSession): Promise<BotUserSession> {
    const [session] = await db.insert(botUserSessions).values(data).returning();
    return session;
  }

  async updateBotSession(sessionId: string, data: Partial<InsertBotUserSession>): Promise<BotUserSession | null> {
    const [updated] = await db.update(botUserSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(botUserSessions.sessionId, sessionId))
      .returning();
    return updated || null;
  }

  // Bot Trades
  async getBotTrades(sessionId: string): Promise<BotTrade[]> {
    return db.select().from(botTrades)
      .where(eq(botTrades.sessionId, sessionId))
      .orderBy(desc(botTrades.createdAt));
  }

  async createBotTrade(data: InsertBotTrade): Promise<BotTrade> {
    const [trade] = await db.insert(botTrades).values(data).returning();
    return trade;
  }

  async updateBotTrade(id: string, data: Partial<InsertBotTrade>): Promise<BotTrade | null> {
    const [updated] = await db.update(botTrades)
      .set(data)
      .where(eq(botTrades.id, id))
      .returning();
    return updated || null;
  }
}

export const storage = new DatabaseStorage();
