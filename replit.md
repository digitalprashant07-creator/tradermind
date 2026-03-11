# TraderMind

Trading journal and performance management app for F&O and Swing traders.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Recharts + wouter
- **Backend**: Express.js + Passport (session auth) + Drizzle ORM
- **Database**: PostgreSQL

## Architecture
- `shared/schema.ts` - Drizzle schema definitions (users, trades, journals, emotionLogs, moneyTransactions)
- `server/routes.ts` - All API routes with session-based auth
- `server/storage.ts` - Database storage layer using Drizzle
- `client/src/App.tsx` - Main app with routing and auth wrapper
- `client/src/lib/auth.tsx` - Auth context provider
- `client/src/pages/` - Page components (dashboard, trades, analytics, money, settings)
- `client/src/components/app-sidebar.tsx` - Navigation sidebar

## Features
- User authentication (register/login with sessions)
- Trade management (add/edit/close/delete trades for F&O and Swing)
- Detailed single trade view dialog (click any trade card or eye icon)
- Trade notes on every trade (shown as preview on cards, full text in detail view)
- Automatic Zerodha charge calculation with full breakdown
- Monthly trade tracking with P&L, win rate, and charges summary
- Advanced date filtering (All Time / Daily / Weekly / Monthly / Custom)
- P&L analytics with charts (monthly, symbol-wise, type comparison)
- Money management (income/expense tracking with charts)
- White elegant theme
- Settings page for profile management

## Database Tables
- `users` - User accounts
- `trades` - Trade records (F&O, Swing, with P&L calculation)
- `journals` - Trading journal entries
- `emotion_logs` - Emotion tracking logs
- `money_transactions` - Income and expense records

## Theme
Soft dark theme with subtle diagonal gradient background (dark navy/indigo tones, 10-14% lightness). Teal accent for profit, red for losses, blue for F&O, purple for Swing. Uses Geist font for UI and JetBrains Mono for numbers. Eye-friendly with good contrast.

## Key Design Decisions
- Charges use real Zerodha fee structure (Delivery CNC for Swing, Intraday MIS for FNO) with full breakdown
- Charges field is read-only in all trade dialogs
- Monthly summary on trades page shows last 6 months of P&L, win rate, and total charges
- `apiRequest(method, url, data)` signature (not fetch-style)
- Auth uses `getQueryFn({ on401: "returnNull" })` to handle logged-out state gracefully
