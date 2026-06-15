# PropOS — Deploy Guide

Stack: **Web (Next.js) → Vercel** · **API (NestJS) → Railway** · **DB → Neon (existing)**

## Order matters
Deploy the API first (to get its URL), then the Web, then point them at each other.

---

## 0. Push the code to GitHub
1. Create a new **private** repo on github.com (e.g. `propos-platform`). Don't add a README.
2. Locally (already initialised), add the remote and push:
   ```
   git remote add origin https://github.com/<you>/propos-platform.git
   git push -u origin main
   ```

## 1. API → Railway
1. railway.app → New Project → **Deploy from GitHub repo** → pick the repo.
2. Settings → **Build**: it will detect the Dockerfile. Set **Dockerfile Path** = `apps/api/Dockerfile` and **Root Directory** = `/` (repo root).
3. Settings → **Variables** — add (from your apps/api/.env):
   - `DATABASE_URL` (Neon string)
   - `CLERK_SECRET_KEY`
   - `BROKER_TOKEN_ENCRYPTION_KEY`
   - `OPENAI_API_KEY` (if used)
   - `CTRADER_CLIENT_ID`, `CTRADER_CLIENT_SECRET`
   - `CTRADER_REDIRECT_URI` = `https://<railway-domain>/v1/broker-connections/ctrader/callback`
   - `PORT` = `3001`
   - `FRONTEND_URL` = (fill after step 2 with the Vercel URL)
4. Settings → **Networking** → Generate Domain. Copy it → this is `<API_URL>` (e.g. `https://propos-api.up.railway.app`).

## 2. Web → Vercel
1. vercel.com → Add New → **Project** → import the same GitHub repo.
2. **Root Directory** = `apps/web`. Framework: Next.js (auto).
3. **Environment Variables** — add:
   - `NEXT_PUBLIC_API_URL` = `https://<railway-domain>/v1`
   - `NEXT_PUBLIC_WS_URL` = `https://<railway-domain>`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/overview`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/overview`
4. Deploy. Copy the Vercel URL (e.g. `https://propos.vercel.app`).

## 3. Wire them together
1. Railway → Variables → set `FRONTEND_URL` = the Vercel URL → redeploy.
2. Clerk dashboard → add the Vercel domain to allowed origins (or create a **production** Clerk instance and swap the keys — recommended before real users).
3. cTrader app → update the redirect URI to the Railway callback URL.

## Migrations (when schema changes)
From local, against the prod DB: `pnpm --filter api exec prisma migrate deploy`
