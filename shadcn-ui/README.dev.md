Local dev (serverless-first)

This project uses serverless API routes under `src/pages/api` and is configured to deploy to Vercel.

Quick setup

1. Install dependencies

   pnpm install

2. Install Vercel CLI (if you don't have it):

   pnpm add -g vercel

3. Start serverless functions locally (listen on port 3001):

   vercel dev --listen 3001

   This will run your serverless `src/pages/api` routes locally and expose them on http://localhost:3001.

4. Start front-end (Vite)

   pnpm run dev

   Vite is configured to proxy `/api` to `process.env.VITE_DEV_API_URL` or `http://localhost:3001` by default, so front-end calls to `/api/*` will be routed to the local serverless functions.

Alternate: If you prefer to run the Express server locally (not required for serverless deployments)

1. Start server (inside `server` folder):

   cd server
   pnpm install
   pnpm run dev

2. Start front-end (from project root):

   pnpm run dev

Quick scripts

- Start Vite front-end:

  pnpm run dev

- Start local Vercel serverless emulator (uses npx if vercel CLI not globally installed):

  pnpm run dev:vercel

- Start local Express API (optional fallback):

  pnpm run dev:api

Troubleshooting vercel

- If `npx vercel dev` fails (exit code 127), ensure Node and npx are available and try installing the vercel CLI globally:

  pnpm add -g vercel

  # or
  npm i -g vercel

- If you can't install globally, use `npx vercel dev --listen 3001` (requires internet to fetch the package). If `npx` fails due to permissions or cache, clearing the npx cache may help.

Notes

- Ensure your environment variables (DATABASE_URL or VITE_TIDB_*) are set when running serverless functions locally or in Vercel.
- For production, configure `DATABASE_URL` in Vercel dashboard and ensure Prisma client generation during build if you use Prisma in `src/pages/api` handlers.

Serverless deployment (Vercel)

1. Ensure environment variables are set on Vercel (at minimum):

   - DATABASE_URL (used by Prisma) OR the set of VITE_TIDB_* variables if you use the custom TiDB setup.

2. Build and deploy on Vercel. The project has a `postinstall` hook to run `prisma generate` so the Prisma client will be available during build.

3. If you deploy via the Vercel CLI:

   vercel --prod

   or connect your GitHub and let Vercel build on push to the main branch.

Prisma notes

- The serverless functions use Prisma. Prisma requires `DATABASE_URL` to be set in production. On Vercel set this in the dashboard.
- We added `postinstall` to run `prisma generate` automatically. If your CI/build environment doesn't run `postinstall`, ensure `prisma generate` is executed before build.

If you want, I can:
- Start `vercel dev --listen 3001` here and run Vite to confirm proxying works.
- Convert any Express routes into `src/pages/api` serverless handlers if you prefer a single source of truth.
- Convert any remaining Express-only endpoints into serverless handlers under `src/pages/api` (I inspected `server/` and it is optional). I can port `init-db.ts` to a serverless `api/db/init` route if you need initialization via HTTP.
- Attempt to run `npx vercel dev` here, but it requires interactive login and a browser flow — you'll need to run that on your machine.
