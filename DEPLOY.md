# Deploying NoteTrade

## 1. Push your code

Make sure the project is in a Git repo and push to GitHub/GitLab/Bitbucket.

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

## 2. Deploy on Vercel (recommended for Next.js)

1. Go to [vercel.com](https://vercel.com) and sign in (or use GitHub).
2. **Import** your NoteTrade repository.
3. **Environment variables** — add these in Vercel → Project → Settings → Environment Variables (for **Production** and **Preview**):

   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key  
   - `NEXT_PUBLIC_APP_URL` — Your live app URL (e.g. `https://note-trade-murex.vercel.app`). **Required** so Google sign-in redirects back to Vercel, not localhost.

   If you use the Supabase Postgres connection string elsewhere in the app, add:

   - `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL` (only if your app uses them)

4. **Deploy** — Vercel will run `npm run build` and deploy. Use the generated URL (e.g. `https://notetrade-xxx.vercel.app`).

## 3. Supabase (required — fixes “redirect to localhost after Google sign-in”)

If you see the landing page on localhost or a broken URL after signing in with Google, Supabase is still using localhost. Do this **before** testing Google sign-in on Vercel:

1. Open **Supabase Dashboard** → **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Vercel URL, e.g. `https://note-trade-murex.vercel.app` (no trailing slash).
3. Under **Redirect URLs**, add:
   - `https://note-trade-murex.vercel.app/auth/callback`
   - `https://note-trade-murex.vercel.app/**`  
   (Replace with your real Vercel URL if different.) You can keep `http://localhost:3000/*` for local dev.
4. **Save**.

5. In **Vercel** → Project → Settings → Environment Variables, add **NEXT_PUBLIC_APP_URL** = `https://note-trade-murex.vercel.app` (no trailing slash), then redeploy.

After this, Google sign-in should redirect back to your Vercel app and then to the dashboard.

## 4. Optional: custom domain

In Vercel → Project → Settings → Domains, add your domain and follow the DNS instructions. Then add that domain to Supabase **Redirect URLs** and **Site URL** as in step 3.

---

**Build fix:** The marquee prices API uses `yahoo-finance2` and runs on the Node.js runtime (see `vercel.json`). The production build has been verified with `npm run build`.
