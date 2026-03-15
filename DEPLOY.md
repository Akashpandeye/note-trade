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

   If you use the Supabase Postgres connection string elsewhere in the app, add:

   - `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL` (only if your app uses them)

4. **Deploy** — Vercel will run `npm run build` and deploy. Use the generated URL (e.g. `https://notetrade-xxx.vercel.app`).

## 3. Supabase after deploy

1. In **Supabase Dashboard** → **Authentication** → **URL Configuration**:
   - **Site URL**: set to your production URL (e.g. `https://notetrade-xxx.vercel.app`)
   - **Redirect URLs**: add `https://notetrade-xxx.vercel.app/**` and `https://notetrade-xxx.vercel.app/auth/callback`

2. If you use **Google OAuth**: the redirect URI in Google Cloud Console is still `https://<project-ref>.supabase.co/auth/v1/callback` (Supabase’s callback). No change needed there; just ensure the Supabase redirect list above includes your app URL.

## 4. Optional: custom domain

In Vercel → Project → Settings → Domains, add your domain and follow the DNS instructions. Then add that domain to Supabase **Redirect URLs** and **Site URL** as in step 3.

---

**Build fix:** The marquee prices API uses `yahoo-finance2` and runs on the Node.js runtime (see `vercel.json`). The production build has been verified with `npm run build`.
