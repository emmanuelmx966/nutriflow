# NutriFlow

> A privacy-first, offline-ready nutrition tracking PWA — calories, macros, weight, water, fasting, and exercise in one place.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## About

NutriFlow is a Progressive Web App for tracking nutrition and health metrics. Built with a focus on **privacy**, **offline-readiness**, and **clean architecture** (SOLID principles).

**Originally built as a personal tool** for tracking daily meals, calories, and health metrics for a specific user. Now open-sourced as a portfolio project and a foundation for a bilingual (Spanish/English) personal edition.

### Core Features

- 🍽️ **Food diary** — log meals by search, barcode, or custom entries
- 📊 **Macro tracking** — calories, protein, carbs, fat with goal adherence
- ⚖️ **Weight tracking** — trend charts + goal achievement predictions (linear regression)
- 💧 **Water intake** — daily goal tracking with quick-add buttons
- ⏱️ **Intermittent fasting** — 16:8, 18:6, 20:4, 24h protocols with live timer
- 🏋️ **Exercise log** — calories burned via MET calculation, 27 seeded exercises
- 📅 **Meal planning** — weekly 7×4 grid + grocery list generation
- 🍳 **Recipes** — create reusable recipes from ingredients
- 🎯 **Goal predictions** — "at this rate, you'll hit your goal in X days"
- 🏆 **Milestones & achievements** — motivational progress tracking
- 📈 **Nutrition score** — composite metric (macro adherence, variety, consistency, hydration)
- 📄 **Reports** — PDF + CSV export by date range *(in progress)*
- 🔒 **Privacy-first** — credentials auth, no third-party tracking
- 📱 **PWA** — installable on iOS and Android, works offline

### Project Status

**Phase 1 of 6 complete.**

- ✅ UI reorganized into single-responsibility folders
- ✅ 5-tab navigation: Hoy | Diario | Progreso | Plan | Reportes
- ✅ Migrated from SQLite to Postgres (Neon)
- ⏳ Phase 2 in progress: barcode hybrid lookup + iOS camera support

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full development plan.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, TailwindCSS 4, Radix UI, Lucide |
| State | Zustand (app state), TanStack Query (server state) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Database | Postgres (Neon) + Prisma 6 |
| Auth | NextAuth.js v4 (credentials + JWT) |
| Hashing | bcrypt (cost 12) |
| Runtime | Bun (dev) / Node 20+ (prod) |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites

- **Bun** ≥ 1.1 — [install](https://bun.sh/)
- **Postgres** database — local or [Neon](https://neon.tech/) free tier
- **Node.js** ≥ 20 — required for production runtime only

### Setup

```bash
# 1. Clone
git clone https://github.com/emmanuelmx966/nutriflow.git
cd nutriflow

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
# Then edit .env with:
#   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
#   NEXTAUTH_SECRET=<generate one — see below>
#   NEXTAUTH_URL=http://localhost:3000

# 4. Apply database schema
bun prisma migrate dev

# 5. Seed initial data (foods + exercises)
bun run db:seed

# 6. Start dev server
bun run dev

Open http://localhost:3000.

Generate NEXTAUTH_SECRET

bun -e "console.log(crypto.randomUUID() + crypto.randomUUID())"

Copy the result into .env.

Project Structure

nutriflow/
├── prisma/
│   ├── schema.prisma              # Database schema (20+ models)
│   ├── migrations/                # Versioned migrations
│   └── seed.ts                    # Initial seed data
├── public/                        # PWA manifest, icons, service worker
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # ~44 API routes
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main view router (6 views)
│   ├── components/
│   │   ├── app/
│   │   │   ├── views/             # Screen-level components
│   │   │   │   ├── diary/         # Food + exercise (8 files)
│   │   │   │   ├── progress/      # Weight + achievements (5 files)
│   │   │   │   ├── plan/          # Meal plan + recipes (10 files)
│   │   │   │   ├── _hidden/       # Removed from nav, kept for reference
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── reports.tsx    # Placeholder (Phase 3)
│   │   │   │   └── profile.tsx
│   │   │   └── app-shell.tsx      # Nav + layout wrapper
│   │   └── ui/                    # Radix-based UI primitives
│   ├── lib/
│   │   ├── auth/                  # NextAuth config + bcrypt
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── services/              # Business logic (~25 services)
│   │   ├── nutrition/             # BMR/TDEE calculators
│   │   ├── security/              # Rate limiting
│   │   ├── validators/            # Zod schemas
│   │   └── utils/                 # Date + misc helpers
│   ├── store/                     # Zustand stores
│   └── types/                     # Shared TS types
└── docs/
    ├── ROADMAP.md                 # 6-phase development plan
    └── ARCHITECTURE.md            # Technical decisions


    See docs/ARCHITECTURE.md for architectural details.

Available Scripts

bun run dev          # Start dev server (port 3000)
bun run build        # Production build
bun run start        # Start production server
bun run lint         # ESLint

bun run db:migrate   # Run Prisma migrations
bun run db:push      # Push schema without migration (dev only)
bun run db:reset     # Reset database (destructive)
bun run db:seed      # Seed initial data
bun prisma studio    # Open Prisma Studio GUI


Security
Passwords hashed with bcrypt (cost factor 12)

Sessions via JWT (stateless, HTTP-only cookies, 30-day expiry)

Timing-attack mitigation in login (bcrypt against dummy hash on miss)

Rate limiting on auth endpoints (10 attempts / 15 min)

Zod input validation on every API endpoint

No client-side secrets — all sensitive operations server-side

Service worker never caches auth tokens or user data

.env gitignored — secrets never committed

PWA
Installable on iOS (Safari → Share → Add to Home Screen) and Android (Chrome → Install app)

Offline shell caching via service worker

Safe-area insets for iOS notch

display: standalone — runs full-screen like a native app

License
MIT — see LICENSE.

