# NoteTrade — Completion & Deployment Checklist

## ✅ Endpoints & Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Page | Landing (public) or redirect to dashboard if logged in |
| `/login` | Page | Email + Google sign-in |
| `/auth/callback` | GET | OAuth code exchange → session → redirect to dashboard |
| `/auth/signout` | POST | Sign out, redirect to /login |
| `/dashboard` | Page | Stats, equity curve, heatmap, monthly chart, recent trades (protected) |
| `/trades` | Page | Paginated trades list + filters (protected) |
| `/trades/[id]` | Page | Trade detail, edit notes/tags/screenshot (protected) |
| `/upload` | Page | CSV upload → preview → confirm → insert (protected) |
| `/analytics` | Page | Win/loss, P&L by symbol/day/time, streaks (protected) |
| (error) | error.tsx | Error boundary with thumbs down |
| (404) | not-found.tsx | Not found with thumbs down |

---

## ✅ Lib & Functions

- **lib/supabase.ts** — `createClient()` (browser), `createServerSupabaseClient()` (server)
- **lib/parseCsv.ts** — `parseZerodhaCsv()`, `matchTradesFifo()`, `parseZerodhaCsvToMatchedTrades()`
- **lib/calcPnl.ts** — `totalPnl`, `winRate`, `avgPnlPerTrade`, `biggestWin`, `biggestLoss`, `formatPnl`, `pnlColorClass`
- **lib/trades.ts** — `getTrades`, `getTradeById`, `getTradesForDashboard`, `getAllTradesForStats`, `getExistingTradeIds`, `insertTrades`, `updateTrade`

---

## Manual Test Checklist (before deploy)

1. **Auth**
   - [ ] Sign up with email → confirm (if email confirmation on) → land on dashboard
   - [ ] Sign in with email → dashboard
   - [ ] Continue with Google → land on dashboard
   - [ ] Sign out → back to login/landing

2. **Upload**
   - [ ] Go to Upload → drop or select Zerodha tradebook CSV
   - [ ] See preview table (Date, Symbol, Segment, Direction, Qty, Entry/Exit, P&L)
   - [ ] Confirm & Save → redirect to Trades, new rows visible

3. **Trades**
   - [ ] Trades list loads, pagination works (if >20)
   - [ ] Filters: date range, symbol, segment, win/loss
   - [ ] Click a row → trade detail page
   - [ ] Edit notes, strategy tag, emotion tag → Save
   - [ ] (Optional) Upload screenshot if bucket is set up

4. **Dashboard**
   - [ ] Stats cards show (Total P&L, Win rate, etc.)
   - [ ] Equity curve and monthly bar chart render
   - [ ] Recent trades list links to trade detail

5. **Analytics**
   - [ ] Win/loss donut, P&L by symbol, by day, by time, streaks, segment breakdown

---

## Vercel Deployment

1. **Env vars in Vercel**
   - Project → Settings → Environment Variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon/publishable key
   - Do **not** add `DATABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` unless you need them server-side (and never expose service role to client).

2. **Supabase redirect URLs**
   - Supabase → Authentication → URL Configuration → Redirect URLs
   - Add your Vercel URL, e.g. `https://your-app.vercel.app/auth/callback`

3. **Google OAuth (if using)**
   - No change in Google Console redirect URI (Supabase callback URL stays the same).
   - Optional: add your Vercel domain to authorized origins in Google if you use popup/embedded flows later.

4. **Deploy**
   - Push to GitHub and connect repo in Vercel, or `vercel` CLI.
   - Build command: `npm run build` (default)
   - Output: Next.js (default)

---

## Supabase Reminders

- **trades** table + RLS: run `supabase-schema.sql` in SQL Editor if not done.
- **Screenshots**: create storage bucket `screenshots` (public) + policies for auth users if you use trade screenshot upload.
