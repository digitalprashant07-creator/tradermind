# TraderMind

A full-stack trading journal and performance management web app for F&O and Swing traders. Track your trades, analyze P&L, manage money flow, and review analytics — all in one place.

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, Recharts, Wouter (routing)
- **Backend:** Node.js, Express 5, Passport.js (session auth)
- **Database:** PostgreSQL with Drizzle ORM
- **Language:** TypeScript (full-stack)

---

## Prerequisites

Before you begin, make sure the following are installed on your machine:

### 1. Node.js (v20 or higher)

Download from [https://nodejs.org](https://nodejs.org) — choose the **LTS** version.

Verify installation:
```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 10.x.x or higher
```

### 2. PostgreSQL (v14 or higher)

- **Windows:** Download from [https://www.postgresql.org/download/windows](https://www.postgresql.org/download/windows)
- **macOS:** Use Homebrew: `brew install postgresql@16`
- **Linux (Ubuntu/Debian):** `sudo apt install postgresql postgresql-contrib`

Verify installation:
```bash
psql --version   # should print psql (PostgreSQL) 14.x or higher
```

---

## Step-by-Step Local Setup

### Step 1 — Clone the Repository

```bash
git clone https://github.com/digitalprashant07-creator/tradermind.git
cd tradermind
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

This installs all frontend and backend packages. It may take 1–2 minutes the first time.

---

### Step 3 — Set Up PostgreSQL Database

#### Start PostgreSQL (if not already running)

**macOS:**
```bash
brew services start postgresql@16
```

**Linux:**
```bash
sudo service postgresql start
```

**Windows:** PostgreSQL should auto-start. You can also start it via the Services panel or pgAdmin.

#### Create the Database

Open a terminal and run:

```bash
psql -U postgres
```

Inside the PostgreSQL prompt, create a new database:

```sql
CREATE DATABASE tradermind;
\q
```

> **Note:** If your PostgreSQL username is not `postgres`, replace it with your actual username (e.g., your system username on macOS).

---

### Step 4 — Create the Environment File

Create a file named `.env` in the **root folder** of the project (same level as `package.json`):

```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/tradermind
SESSION_SECRET=pick-any-long-random-string-here
```

**Replace:**
- `postgres` — your PostgreSQL username
- `your_password` — your PostgreSQL password (leave empty if none: `postgresql://postgres@localhost:5432/tradermind`)
- `pick-any-long-random-string-here` — any random text, e.g. `tradermind_super_secret_2024`

**Example with no password:**
```
DATABASE_URL=postgresql://postgres@localhost:5432/tradermind
SESSION_SECRET=tradermind_super_secret_2024
```

---

### Step 5 — Create Database Tables

Run this command to automatically create all the required tables in your database:

```bash
npm run db:push
```

This reads the schema from `shared/schema.ts` and creates these tables:
- `users` — user accounts
- `trades` — all trade records
- `journals` — trading journal entries
- `emotion_logs` — emotion tracking
- `money_transactions` — income and expense records

You should see output confirming the tables were created successfully.

---

### Step 6 — Start the Development Server

```bash
npm run dev
```

This starts the full app (both backend API and frontend) on a single port.

Open your browser and go to:

```
http://localhost:5000
```

You should see the TraderMind login/register screen.

---

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (frontend + backend on port 5000) |
| `npm run build` | Build the app for production |
| `npm start` | Run the production build |
| `npm run db:push` | Sync database schema (create/update tables) |
| `npm run check` | Run TypeScript type checking |

---

## Project Structure

```
tradermind/
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/           # Dashboard, Trades, Analytics, Money, Settings
│   │   ├── components/      # UI components (sidebar, shadcn/ui)
│   │   ├── lib/             # Auth context, query client, utils
│   │   └── hooks/           # Custom React hooks
│   └── index.html
├── server/                  # Express backend
│   ├── index.ts             # App entry point
│   ├── routes.ts            # All API routes + auth
│   ├── storage.ts           # Database queries (Drizzle ORM)
│   └── vite.ts              # Vite dev server integration
├── shared/
│   └── schema.ts            # Database schema + TypeScript types (shared by frontend & backend)
├── script/
│   └── build.ts             # Production build script
├── drizzle.config.ts        # Drizzle ORM config
├── vite.config.ts           # Vite config
├── tailwind.config.ts       # Tailwind CSS config
└── package.json
```

---

## How the App Works

- **Single port:** Both the API (`/api/*`) and the React frontend are served from `http://localhost:5000`. You do not need to run two separate servers.
- **Authentication:** Session-based (no JWT). After logging in, your session is stored server-side and kept alive with a cookie for 7 days.
- **Database:** All data is stored in your local PostgreSQL database. No external services required.
- **Charges:** Zerodha brokerage and charge calculations are done entirely in code — no external API calls.

---

## Troubleshooting

### "DATABASE_URL not found" error
Make sure your `.env` file exists in the root folder and has the correct `DATABASE_URL` value.

### "Connection refused" on PostgreSQL
Make sure PostgreSQL is running. Check with:
```bash
psql -U postgres -c "\l"
```

### Port 5000 already in use
Another app is using port 5000. Either stop that app, or temporarily change the port by running:
```bash
PORT=3000 npm run dev
```
Then open `http://localhost:3000`.

### `npm run db:push` fails
Double-check that:
1. The `tradermind` database exists in PostgreSQL
2. Your `DATABASE_URL` in `.env` has the correct username/password
3. PostgreSQL is running

### Replit-specific packages warning
You may see warnings about `@replit/connectors-sdk` or `@replit/vite-plugin-*`. These are safe to ignore — the app is built to detect when it's not running on Replit and skips those plugins automatically.

---

## Features

- **Trade Management** — Add, edit, close, and delete trades (F&O and Swing)
- **Detailed Trade View** — Click any trade to see full breakdown including charges, notes, and emotions
- **Zerodha Charges** — Real brokerage calculation (Delivery CNC for Swing, Intraday MIS for F&O) with full line-by-line breakdown
- **Trade Notes** — Add notes to every trade; preview shown on trade cards
- **Date Filtering** — Filter trades by All Time, Daily, Weekly, Monthly, or Custom date range
- **Monthly Summary** — Last 6 months of P&L, win rate, and charge totals
- **Analytics** — Monthly P&L charts, symbol-wise breakdown, trade type comparison
- **Money Management** — Track income and expenses with monthly cash flow charts
- **Settings** — Update your profile, trading style, and risk profile
