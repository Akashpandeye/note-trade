# NoteTrade — Trading Journal

NoteTrade is a modern trading journal web app built with **Next.js 15**, **TypeScript**, **Supabase**, and **Tailwind CSS**.

Live app: **https://note-trade-murex.vercel.app**

---

## ✨ Features

- **Google sign-in only** (no email/password clutter)
- **Dashboard**
  - Stats cards (total P&L, win rate, etc.)
  - Last 7 trades bar chart (green/red by P&L)
  - Monthly P&L chart
  - Daily P&L heatmap
  - Recent trades list
- **Trades**
  - Paginated trades table with filters and sorting
  - Trade detail view (notes, screenshot upload)
- **Upload CSV**
  - Dashboard “Upload CSV” button → file picker
  - Zerodha P&L CSV parsing (tab/comma, summary format)
  - Preview dialog, then “Confirm & Save”
- **Book**
  - Manual trade entry form
- **Analytics**
  - Win/loss pie chart
  - Avg winner vs avg loser
  - P&L by symbol, day of week, time of day, segment
  - **Long vs Short performance** (counts, win rate, average P&L)
  - Current win/loss streak
- **UX / Visuals**
  - Dark navy + neon green fintech theme
  - Light/dark mode with a small slider toggle
  - Glowing price marquee with index/commodity prices
  - Custom logo in headers + favicon
  - Responsive layout (desktop-first, works on mobile)

---

## 🧱 Tech Stack

### Frameworks & Runtime

- **[Next.js 15](https://nextjs.org/)**
  - App Router (`app/` directory)
  - API routes (`app/api/marquee-prices/route.ts`)
  - Middleware for auth redirects
  - SSR for authenticated pages (dashboard, trades, analytics, book)

- **[React 18](https://react.dev/)**
  - Client components for interactive pieces (charts, upload, filters, forms)
  - Hooks (`useState`, `useEffect`, `useCallback`) for UI state & data fetching

- **[TypeScript](https://www.typescriptlang.org/)**
  - Strict typing across code (`types/index.ts`, `lib/**`, components)

### Styling & UI

- **[Tailwind CSS](https://tailwindcss.com/)**
  - Utility classes for layout and theme
  - Custom fonts (`Syne`), colors, animations (`marquee`, starry backgrounds)
  - Dark mode via `class` strategy (`dark:` variants)

- **Custom UI components (`components/ui`)**
  - `button.tsx`: Shared button with variants (`default`, `outline`, `ghost`, `destructive`)
  - `card.tsx`: Card, CardHeader, CardTitle, CardContent wrappers
  - `input.tsx`, `label.tsx`, `alert.tsx`, `select.tsx`, `skeleton.tsx`

### Auth & Backend

- **[Supabase](https://supabase.com/)**
  - **Auth**
    - Google OAuth (via Supabase Auth)
    - Session handling via `createServerSupabaseClient` (`lib/supabase.ts`)
  - **Database**
    - `trades` table (schema in `supabase-schema.sql`)
    - Reads: `getTrades`, `getTradesForDashboard`, `getAllTradesForStats` (`lib/trades.ts`)
    - Writes: `insertTrades` for CSV + manual entries

- **Supabase JS SDK**
  - `@supabase/supabase-js`: main client
  - `@supabase/ssr`: helpers to integrate Supabase with Next.js App Router / SSR

### CSV Parsing & P&L

- **[PapaParse](https://www.papaparse.com/) (`papaparse`)**
  - Parsing Zerodha CSVs in `lib/parseCsv.ts`
  - Handles:
    - Header detection
    - Summary vs tradebook formats
    - Tab/comma delimiters
    - Normalizing headers to consistent field names

- **Custom P&L logic (`lib/calcPnl.ts`)**
  - `formatPnl`, `pnlColorClass`
  - Helper functions for:
    - `totalPnl`
    - `winRate`
    - `avgPnlPerTrade`
    - `biggestWin`, `biggestLoss`
  - `TradeForStats` type for dashboard/analytics calculations

### Forms & Validation

- **[react-hook-form](https://react-hook-form.com/)**
  - Used in the **Book** (manual trade entry) form
  - Handles controlled inputs & submission state

- **[Zod](https://github.com/colinhacks/zod)**
  - Validation schemas for forms
  - Combined with `react-hook-form` for type-safe validation

- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)**
  - Bridges Zod with `react-hook-form`

### Charts & Visualizations

- **[Recharts](https://recharts.org/)**
  - Dashboard:
    - Last 7 Trades bar chart
    - Monthly P&L bar chart
    - Weekly P&L (if enabled)
  - Analytics:
    - Win/Loss pie chart
    - Avg winner vs loser bar chart
    - P&L by symbol, day of week, time of day
    - Segment breakdown

### Other

- **ESLint + eslint-config-next**
  - Linting (`npm run lint`) for best practices and type-safety

- **PostCSS + Autoprefixer**
  - Tailwind + cross-browser CSS

---

## 🚀 Getting Started (Local Development)

### 1. Clone the repo

```bash
git clone <your-repo-url> notetrade
cd notetrade
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create `.env.local` in the project root (or copy from `.env.example`):

```bash
cp .env.example .env.local
```

Fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Optional, used only on the server (be careful, do not expose this publicly)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
```

> **Important:** These should match the values from Supabase Dashboard → Settings → API and Database.

### 4. Supabase setup

1. In **Supabase SQL editor**, run `supabase-schema.sql` to create the `trades` table.
2. In **Authentication → Providers**, enable **Google**:
   - Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. In **Authentication → URL Configuration**:
   - **Site URL**: your production URL (e.g. `https://note-trade-murex.vercel.app`)
   - **Redirect URLs**:
     - `https://note-trade-murex.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local dev)

### 5. Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🧪 Linting & Build

### Lint

```bash
npm run lint
```

### Production build

```bash
npm run build
```

To run the production build locally:

```bash
npm run build
npm start
```

Then open `http://localhost:3000`.

---

## 📁 Project Structure (Overview)

```text
app/
  layout.tsx             # Root layout, fonts, metadata, favicon
  page.tsx               # Landing page (marketing hero)
  (auth)/login/page.tsx  # Google-only sign-in UI
  auth/callback/route.ts # Supabase OAuth callback & redirect
  auth/signout/route.ts  # Sign out and redirect to landing
  (app)/layout.tsx       # Logged-in shell: header, nav, marquee, glow
  (app)/dashboard/page.tsx
  (app)/trades/page.tsx
  (app)/trades/[id]/page.tsx
  (app)/analytics/page.tsx
  (app)/book/page.tsx
  (app)/upload/page.tsx  # Redirects to /dashboard

components/
  layout/IndexMarquee.tsx
  layout/ThemeToggle.tsx
  dashboard/*
  trades/*
  upload/*
  analytics/AnalyticsCharts.tsx
  ui/*

lib/
  supabase.ts
  trades.ts
  parseCsv.ts
  calcPnl.ts

types/
  index.ts

public/
  favicon.svg
  logo-header.png
  logo-mark.png
  logo-notetrade.png
```

---

## 🌐 Deployment

Recommended: **Vercel** + **Supabase**.

1. Push the repo to GitHub / GitLab / Bitbucket.
2. In Vercel:
   - Import the project.
   - Set env vars:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - (Optional) `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
   - Deploy.
3. In Supabase:
   - Update **Site URL** and **Redirect URLs** to include your Vercel URL.
   - Ensure Google provider is configured correctly.

See `DEPLOY.md` for more detailed deployment steps.

---

## 📌 Summary

NoteTrade is a production-ready trading journal:

- Clean UX with a modern fintech look.
- Supabase-backed auth and database.
- Rich P&L analytics and visualizations.
- Support for Zerodha CSV workflows plus manual journaling.

