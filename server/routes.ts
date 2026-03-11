import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import MemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const SessionStore = MemoryStore(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "tradermind-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({ checkPeriod: 86400000 }),
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "Invalid credentials" });
        const valid = await comparePasswords(password, user.password);
        if (!valid) return done(null, false, { message: "Invalid credentials" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });

  function requireAuth(req: Request, res: Response, next: any) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({ message: "All fields required" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }
      const hashed = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashed, name });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        const { password: _, ...safeUser } = user;
        return res.json(safeUser);
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.put("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { name, tradingStyle, riskProfile } = req.body;
      const updated = await storage.updateUser(user.id, { name, tradingStyle, riskProfile });
      if (!updated) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/trades", requireAuth, async (req, res) => {
    const user = req.user as any;
    const result = await storage.getTrades(user.id);
    res.json(result);
  });

  app.post("/api/trades", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const trade = await storage.createTrade(user.id, req.body);
      res.json(trade);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/trades/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const trade = await storage.getTrade(parseInt(req.params.id));
    if (!trade || trade.userId !== user.id) return res.status(404).json({ message: "Not found" });
    res.json(trade);
  });

  app.put("/api/trades/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const trade = await storage.getTrade(parseInt(req.params.id));
      if (!trade || trade.userId !== user.id) return res.status(404).json({ message: "Not found" });
      const updated = await storage.updateTrade(parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/trades/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const trade = await storage.getTrade(parseInt(req.params.id));
    if (!trade || trade.userId !== user.id) return res.status(404).json({ message: "Not found" });
    await storage.deleteTrade(parseInt(req.params.id));
    res.json({ message: "Deleted" });
  });


  app.get("/api/money", requireAuth, async (req, res) => {
    const user = req.user as any;
    const result = await storage.getMoneyTransactions(user.id);
    res.json(result);
  });

  app.post("/api/money", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const txn = await storage.createMoneyTransaction(user.id, req.body);
      res.json(txn);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/money/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const txn = await storage.getMoneyTransaction(parseInt(req.params.id));
    if (!txn || txn.userId !== user.id) return res.status(404).json({ message: "Not found" });
    res.json(txn);
  });

  app.put("/api/money/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const txn = await storage.getMoneyTransaction(parseInt(req.params.id));
      if (!txn || txn.userId !== user.id) return res.status(404).json({ message: "Not found" });
      const updated = await storage.updateMoneyTransaction(parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/money/:id", requireAuth, async (req, res) => {
    const user = req.user as any;
    const txn = await storage.getMoneyTransaction(parseInt(req.params.id));
    if (!txn || txn.userId !== user.id) return res.status(404).json({ message: "Not found" });
    await storage.deleteMoneyTransaction(parseInt(req.params.id));
    res.json({ message: "Deleted" });
  });

  return httpServer;
}
