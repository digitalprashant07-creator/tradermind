import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  users, trades, journals, emotionLogs, moneyTransactions,
  type User, type InsertUser,
  type Trade, type InsertTrade,
  type Journal, type InsertJournal,
  type EmotionLog, type InsertEmotionLog,
  type MoneyTransaction, type InsertMoneyTransaction,
} from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;

  getTrades(userId: number): Promise<Trade[]>;
  getTrade(id: number): Promise<Trade | undefined>;
  createTrade(userId: number, trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, data: Partial<Trade>): Promise<Trade | undefined>;
  deleteTrade(id: number): Promise<void>;

  getJournals(userId: number): Promise<Journal[]>;
  getJournal(id: number): Promise<Journal | undefined>;
  createJournal(userId: number, journal: InsertJournal): Promise<Journal>;
  updateJournal(id: number, data: Partial<Journal>): Promise<Journal | undefined>;
  deleteJournal(id: number): Promise<void>;

  getEmotionLogs(userId: number): Promise<EmotionLog[]>;
  createEmotionLog(userId: number, log: InsertEmotionLog): Promise<EmotionLog>;

  getMoneyTransactions(userId: number): Promise<MoneyTransaction[]>;
  getMoneyTransaction(id: number): Promise<MoneyTransaction | undefined>;
  createMoneyTransaction(userId: number, txn: InsertMoneyTransaction): Promise<MoneyTransaction>;
  updateMoneyTransaction(id: number, data: Partial<MoneyTransaction>): Promise<MoneyTransaction | undefined>;
  deleteMoneyTransaction(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getTrades(userId: number): Promise<Trade[]> {
    return db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.createdAt));
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  async createTrade(userId: number, trade: InsertTrade): Promise<Trade> {
    const [created] = await db.insert(trades).values({ ...trade, userId }).returning();
    return created;
  }

  async updateTrade(id: number, data: Partial<Trade>): Promise<Trade | undefined> {
    const [updated] = await db.update(trades).set(data).where(eq(trades.id, id)).returning();
    return updated;
  }

  async deleteTrade(id: number): Promise<void> {
    await db.delete(trades).where(eq(trades.id, id));
  }

  async getJournals(userId: number): Promise<Journal[]> {
    return db.select().from(journals).where(eq(journals.userId, userId)).orderBy(desc(journals.createdAt));
  }

  async getJournal(id: number): Promise<Journal | undefined> {
    const [journal] = await db.select().from(journals).where(eq(journals.id, id));
    return journal;
  }

  async createJournal(userId: number, journal: InsertJournal): Promise<Journal> {
    const [created] = await db.insert(journals).values({ ...journal, userId }).returning();
    return created;
  }

  async updateJournal(id: number, data: Partial<Journal>): Promise<Journal | undefined> {
    const [updated] = await db.update(journals).set(data).where(eq(journals.id, id)).returning();
    return updated;
  }

  async deleteJournal(id: number): Promise<void> {
    await db.delete(journals).where(eq(journals.id, id));
  }

  async getEmotionLogs(userId: number): Promise<EmotionLog[]> {
    return db.select().from(emotionLogs).where(eq(emotionLogs.userId, userId)).orderBy(desc(emotionLogs.createdAt));
  }

  async createEmotionLog(userId: number, log: InsertEmotionLog): Promise<EmotionLog> {
    const [created] = await db.insert(emotionLogs).values({ ...log, userId }).returning();
    return created;
  }

  async getMoneyTransactions(userId: number): Promise<MoneyTransaction[]> {
    return db.select().from(moneyTransactions).where(eq(moneyTransactions.userId, userId)).orderBy(desc(moneyTransactions.createdAt));
  }

  async getMoneyTransaction(id: number): Promise<MoneyTransaction | undefined> {
    const [txn] = await db.select().from(moneyTransactions).where(eq(moneyTransactions.id, id));
    return txn;
  }

  async createMoneyTransaction(userId: number, txn: InsertMoneyTransaction): Promise<MoneyTransaction> {
    const [created] = await db.insert(moneyTransactions).values({ ...txn, userId }).returning();
    return created;
  }

  async updateMoneyTransaction(id: number, data: Partial<MoneyTransaction>): Promise<MoneyTransaction | undefined> {
    const [updated] = await db.update(moneyTransactions).set(data).where(eq(moneyTransactions.id, id)).returning();
    return updated;
  }

  async deleteMoneyTransaction(id: number): Promise<void> {
    await db.delete(moneyTransactions).where(eq(moneyTransactions.id, id));
  }
}

export const storage = new DatabaseStorage();
