import { db } from "./storage";

export async function seedDatabase() {
  console.log("Seeding database...");

  // Create tables if they don't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      trading_style TEXT NOT NULL DEFAULT 'BOTH',
      risk_profile TEXT NOT NULL DEFAULT 'MODERATE',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      trade_type TEXT NOT NULL,
      position_type TEXT NOT NULL,
      segment TEXT NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL,
      quantity INTEGER NOT NULL,
      lot_size INTEGER,
      strike_price REAL,
      option_type TEXT,
      expiry TEXT,
      entry_date TEXT NOT NULL,
      exit_date TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      profit_loss REAL,
      charges REAL DEFAULT 0,
      net_pnl REAL,
      notes TEXT,
      tags TEXT[],
      emotion_entry TEXT,
      emotion_exit TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS journals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      trade_id INTEGER,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      emotions TEXT,
      lessons_learned TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS emotion_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      emotion TEXT NOT NULL,
      intensity INTEGER NOT NULL,
      context TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS money_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      category TEXT,
      month INTEGER,
      year INTEGER,
      payment_mode TEXT,
      is_recurring BOOLEAN DEFAULT FALSE,
      tags TEXT[],
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Add missing columns if they don't exist
  await db.execute(`
    ALTER TABLE money_transactions
    ADD COLUMN IF NOT EXISTS month INTEGER,
    ADD COLUMN IF NOT EXISTS year INTEGER,
    ADD COLUMN IF NOT EXISTS payment_mode TEXT,
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tags TEXT[]
  `);

  console.log("Database tables created/verified");
}