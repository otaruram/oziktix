# OzikTix | Monolith Architecture (Fullstack End-to-End)
### Summarecon Mall Bandung Atrium Gala 2026 — Bandung Build Challenge 2026

**OzikTix** is an interactive seat ticketing and cryptographic check-in monolith engineered with:
- **Clean Architecture Monorepo**: `fe/` (Frontend) & `be/` (Backend)
- **Design System**: Strict Hallmark (`usehallmark.com`) & `impeccable.style` Dark Precision (anti-AI-slop, tabular figures, physical ticket notches)
- **Database & Auth**: Supabase PostgreSQL with Prisma ORM, Google OAuth 2.0 with judge bypass
- **Cryptographic Security**: HMAC-SHA256 signatures with live 30-second rotating TOTP nonces

---

## 🏛️ Monolith Directory Structure

```
oziktix/
├── package.json                         # Monolith workspace root
├── fe/                                  # Frontend Application (React, Vite, Tailwind CSS, Lucide)
│   ├── src/
│   │   ├── config/                      # env.ts, supabase.ts
│   │   ├── types/                       # TypeScript contracts
│   │   ├── services/                    # Axios API client (seat, checkout, gate, admin)
│   │   ├── hooks/                       # useAuth, useSeatHoldTimer, useRotatingQr
│   │   ├── components/                  # Hallmark-styled components & views
│   │   ├── App.tsx                      # Root shell & orchestrator
│   │   └── index.css                    # Obsidian theme, hairline borders, ticket notches
│   └── vite.config.ts                   # Port 5000
└── be/                                  # Backend API (Node.js, Express, Prisma, Supabase, Crypto)
    ├── prisma/
    │   ├── schema.prisma                # Seat, Ticket, GateLog models
    │   └── seed.ts                      # 60 Physical Seats of SMB Atrium
    ├── src/
    │   ├── domain/                      # Types, invariants, and errors (409, 429, 401)
    │   ├── infrastructure/              # Prisma singleton, Supabase Auth, StatefulEngine (HMAC+TOTP)
    │   ├── repositories/                # Raw atomic SQL queries (hold, swap, ticket, gate)
    │   ├── services/                    # Seat hold, quota, checkout, gate 3-tier, admin
    │   ├── interfaces/http/             # Express controllers, routes, middlewares
    │   └── app.ts                       # Server entry on Port 8080
    ├── .env                             # Database connection & HMAC secrets
    └── tsconfig.json
```

---

## 🚀 Running the Monolith

Both servers can run concurrently:

```bash
# 1. Start Backend (Express API on Port 8080)
cd be
npm run dev

# 2. Start Frontend (Vite on Port 5000)
cd fe
npm run dev
```

- **Frontend Application:** [http://localhost:5000/](http://localhost:5000/)
- **Backend API Base URL:** [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- **Backend Health Check:** [http://localhost:8080/health](http://localhost:8080/health)

---

## 🔗 Connecting to Live Supabase PostgreSQL

1. In your **Supabase Dashboard**, navigate to **Project Settings -> Database**.
2. Copy the **Connection String (URI)** in **Transaction Pooler** mode (port 6543).
3. Paste it into `be/.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
4. Run migrations & seed:
   ```bash
   cd be
   npx prisma migrate dev --name init_oziktix
   npx prisma db seed
   ```

---

## 🛡️ Key Verified Features

1. **Max 2 Quota Enforcement (QA Point #1):**
   - User attempting to hold a 3rd seat receives `429 Too Many Requests` ("Purchase limit reached: Maximum 2 seats per verified Google account").
2. **Atomic Row-Level Locking:**
   - Real atomic SQL conditional update `UPDATE "Seat" SET status = 'RESERVED' ... WHERE status = 'AVAILABLE' OR (status = 'RESERVED' AND holdExpiresAt < NOW())` prevents race conditions.
3. **5:00 Checkout Hold TTL (QA Point #3):**
   - Auto-releases held seats if checkout is unconfirmed within 300 seconds.
4. **30-Second Dynamic Rotating TOTP (QA Point #2):**
   - `GET /api/v1/tickets/:id/qr-payload` calculates current `Math.floor(Date.now() / 30000)` bucket and returns fresh HMAC-SHA256 signature + remaining seconds.
5. **Atomic Seat Relocation (QA Point #4):**
   - `POST /api/v1/tickets/:id/swap` atomically claims new seat in same tier, releases old seat, increments `swapCount`, and rotates `secretNonce`.
6. **3-Tier Gate Scanner:**
   - 🟢 **Tier 1 Green:** `ACCESS_GRANTED` (Valid HMAC & matching TOTP window)
   - 🟡 **Tier 2 Yellow:** `ALREADY_USED` (Anti-passback alert with previous check-in time)
   - 🔴 **Tier 3 Red:** `ACCESS_DENIED_REVOKED` / `INVALID_SIGNATURE`
7. **Admin Dashboard & Real CSV Stream:**
   - `GET /api/v1/admin/dashboard` returns real-time metrics.
   - `GET /api/v1/admin/export-attendees` streams real Excel-compatible CSV.
   - `POST /api/v1/admin/refund/:ticketId` voids ticket and releases seat back to `AVAILABLE`.

---

## 🌐 Deployment Guide: Vercel (Frontend) & Render (Backend)

### 1. Deploy Frontend to Vercel
- **Root Directory:** `fe`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_BASE_URL`: URL of your deployed backend on Render (e.g. `https://oziktix-backend.onrender.com`)
  - `VITE_SUPABASE_URL`: Your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key

### 2. Deploy Backend to Render
- **Environment:** Node.js
- **Root Directory:** `be`
- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `PORT`: `8080` (or leave default for Render)
  - `NODE_ENV`: `production`
  - `DATABASE_URL`: Your Supabase PostgreSQL Connection String (Transaction Pooler port 6543 with `&connection_limit=15&pool_timeout=25`)
  - `SUPABASE_URL`: Your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role secret
  - `HMAC_SECRET`: Your production HMAC secret string

### 3. Supabase Free Tier Keep-Alive
To prevent Supabase Free Tier from pausing after 7 days of inactivity:
- An internal **10-minute automated database ping** (`KeepAliveService`) is integrated into the backend.
- A GitHub Actions workflow (`.github/workflows/keep-alive.yml`) automatically pings the backend `/api/v1/ping` every 6 hours.
- Set `RENDER_BACKEND_URL` in your GitHub repository secrets (`Settings -> Secrets and variables -> Actions`) to enable automated GitHub cron pings.

