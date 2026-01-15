import { db } from "./db";
import { verifiedTokens, scanLogs, failedTokens, siteAds } from "@shared/schema";
import type { InsertVerifiedToken, InsertScanLog, InsertFailedToken, InsertSiteAd, VerifiedToken, ScanLog, FailedToken, SiteAd } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
