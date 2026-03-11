import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  boolean,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  tradingStyle: text("trading_style").notNull().default("BOTH"),
  riskProfile: text("risk_profile").notNull().default("MODERATE"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  tradeType: text("trade_type").notNull(),
  positionType: text("position_type").notNull(),
  segment: text("segment").notNull(),
  entryPrice: real("entry_price").notNull(),
  exitPrice: real("exit_price"),
  quantity: integer("quantity").notNull(),
  lotSize: integer("lot_size"),
  strikePrice: real("strike_price"),
  optionType: text("option_type"),
  expiry: text("expiry"),
  entryDate: text("entry_date").notNull(),
  exitDate: text("exit_date"),
  status: text("status").notNull().default("OPEN"),
  profitLoss: real("profit_loss"),
  charges: real("charges").default(0),
  netPnL: real("net_pnl"),
  notes: text("notes"),
  tags: text("tags").array(),
  emotionEntry: text("emotion_entry"),
  emotionExit: text("emotion_exit"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mood: text("mood").notNull(),
  date: text("date").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emotionLogs = pgTable("emotion_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  emotion: text("emotion").notNull(),
  intensity: integer("intensity").notNull(),
  trigger: text("trigger"),
  notes: text("notes"),
  tradeId: integer("trade_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moneyTransactions = pgTable("money_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  description: text("description"),
  paymentMode: text("payment_mode"),
  isRecurring: boolean("is_recurring").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertJournalSchema = createInsertSchema(journals).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertEmotionLogSchema = createInsertSchema(emotionLogs).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertMoneyTransactionSchema = createInsertSchema(moneyTransactions).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Journal = typeof journals.$inferSelect;
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type EmotionLog = typeof emotionLogs.$inferSelect;
export type InsertEmotionLog = z.infer<typeof insertEmotionLogSchema>;
export type MoneyTransaction = typeof moneyTransactions.$inferSelect;
export type InsertMoneyTransaction = z.infer<typeof insertMoneyTransactionSchema>;
