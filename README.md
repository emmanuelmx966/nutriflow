# NutriFlow — Secure Nutrition Tracking PWA

A secure, reliable, functional Progressive Web App combining the best features of **FatSecret** and **MyFitnessPal**: calorie tracking, macro management, exercise logging, intermittent fasting, meal planning, AI photo food recognition, social recipes, gamification, and more.

## ✨ Features

### Core Nutrition Tracking
- **Food Diary** — 85+ seeded foods, custom foods, barcode scanner (camera + manual), AI photo recognition (VLM-powered)
- **Calorie & Macro Tracking** — Mifflin-St Jeor BMR, TDEE calculation, auto-generated goals
- **Exercise Logging** — MET-based calorie burn calculation, 27 seeded exercises
- **Weight Tracking** — Progress charts, goal predictions (linear regression)
- **Water Intake** — Daily tracking with quick-add buttons
- **Intermittent Fasting** — 16:8, 18:6, 20:4, 24h protocols with live timer

### Smart Features
- **AI Meal Photo Recognition** — Snap a photo, AI identifies foods + estimates calories/macros
- **Macro-Based Recommendations** — Suggests recipes + foods to fill remaining macro gaps
- **Smart Nutrition Tips** — Contextual advice based on today's data
- **Food Search Autocomplete** — Instant suggestions with 1-tap logging
- **Quick Add** — Recent foods + favorites with star/unstar management

### Meal Planning
- **Weekly Meal Plan** — 7×4 grid, auto-plan, manual assignment
- **Meal Plan Templates** — 6 curated templates (Balanced, High Protein, Mediterranean, Low Carb, Plant Forward, Performance)
- **Grocery List** — Auto-generated from meal plan ingredients with interactive checkboxes

### Social & Community
- **Recipe Builder** — Create custom recipes with ingredients, share publicly
- **Recipe Likes** — Like/unlike community recipes
- **Recipe Ratings** — 1-5 star ratings with average computation
- **Recipe Comments** — Comment on community recipes
- **Community Leaderboard** — Compare nutrition scores with other users

### Gamification
- **Nutrition Score** — Composite 0-100 score (macro adherence, variety, consistency, hydration) with A-F grade
- **Score History Chart** — Track score over time (7/14/30 days)
- **12 Milestones** — Score thresholds, streaks, perfect days, logging consistency
- **9 Achievements** — First Steps, On a Roll, Week Warrior, Monthly Master, etc.
- **Streak Tracking** — Current + longest streak with day-segment visualization
- **Milestone Notifications** — Celebratory toast when unlocking new milestones

### Analytics
- **Per-Meal Macro Targets** — 30/40/25/5 calorie distribution across meals
- **Macro Breakdown Chart** — Donut chart showing % of calories from protein/carbs/fat
- **Weekly Summary** — 7-day averages with week-over-week trend
- **Goal Predictions** — "At this rate, you'll reach your goal in X days" with confidence level
- **Insights Dashboard** — Streaks, achievements, milestones, leaderboard

### Security & PWA
- **Secure Auth** — NextAuth v4 with bcrypt (cost 12), JWT HTTP-only cookies, rate limiting
- **Input Validation** — Zod schemas on every API endpoint
- **PWA** — Installable manifest, service worker (offline shell caching), safe-area support
- **Data Portability** — Export (JSON/CSV) + Import (JSON)

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | Prisma ORM + SQLite |
| Auth | NextAuth.js v4 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| AI | z-ai-web-dev-sdk (VLM glm-4.6v) |
| Icons | Lucide React |
| Passwords | bcryptjs (cost factor 12) |

## 📁 Project Structure

```
nutriflow/
├── prisma/
│   ├── schema.prisma          # 20+ models (User, Food, FoodLog, Recipe, etc.)
│   └── seed.ts                # 85 foods + 27 exercises seed data
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── icon-192.svg           # App icons
│   ├── icon-512.svg
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── api/               # 40+ API routes
│   │   │   ├── auth/           # NextAuth + register
│   │   │   ├── foods/          # Search, autocomplete, custom, barcode
│   │   │   ├── diary/          # Food log CRUD
│   │   │   ├── exercise/       # Exercise log CRUD
│   │   │   ├── weight/         # Weight tracking
│   │   │   ├── water/          # Water intake
│   │   │   ├── goals/          # Goal management
│   │   │   ├── fasting/        # Intermittent fasting
│   │   │   ├── stats/          # Dashboard aggregation
│   │   │   ├── score/          # Nutrition score + history
│   │   │   ├── insights/        # Streaks, achievements
│   │   │   ├── milestones/     # Score milestones
│   │   │   ├── leaderboard/    # Community ranking
│   │   │   ├── recipes/        # CRUD, likes, ratings, comments
│   │   │   ├── meal-plan/      # Weekly plan + grocery + templates
│   │   │   ├── favorites/      # Food favorites
│   │   │   ├── recommendations/# Macro-based suggestions
│   │   │   ├── ai/             # AI meal photo analysis
│   │   │   ├── export/         # JSON/CSV export
│   │   │   ├── import/         # JSON import
│   │   │   ├── prediction/    # Goal achievement prediction
│   │   │   ├── weekly-summary/ # 7-day averages
│   │   │   └── profile/        # User profile
│   │   ├── globals.css         # Tailwind + theme + CSS gradients
│   │   ├── layout.tsx          # Root layout (PWA metadata)
│   │   └── page.tsx            # Single-page app with view switching
│   ├── components/
│   │   ├── app/                # 25+ app components
│   │   │   ├── views/          # 7 views (dashboard, diary, exercise, etc.)
│   │   │   ├── auth-screen.tsx
│   │   │   ├── app-shell.tsx   # Top bar + bottom nav
│   │   │   ├── barcode-scanner.tsx
│   │   │   ├── meal-photo-analyzer.tsx
│   │   │   ├── food-autocomplete.tsx
│   │   │   ├── quick-add.tsx
│   │   │   ├── nutrition-score-card.tsx
│   │   │   ├── milestone-notifier.tsx
│   │   │   ├── leaderboard-card.tsx
│   │   │   ├── star-rating.tsx
│   │   │   └── ...
│   │   ├── ui/                 # 50+ shadcn/ui components
│   │   ├── providers.tsx       # Session + Theme + QueryClient
│   │   └── sw-register.tsx     # Service worker registration
│   ├── lib/
│   │   ├── ai/                 # MealVisionService (VLM integration)
│   │   ├── api/                # Response helpers
│   │   ├── auth/               # NextAuth config + bcrypt
│   │   ├── security/           # Rate limiting
│   │   ├── nutrition/          # BMR/TDEE calculator
│   │   ├── services/           # 20+ SOLID services
│   │   ├── validators/         # Zod schemas
│   │   ├── utils/              # Date helpers
│   │   ├── api-client.ts       # Typed fetch client
│   │   └── db.ts               # Prisma client
│   ├── store/
│   │   └── app-store.ts        # Zustand store
│   └── types/
│       └── next-auth.d.ts      # NextAuth type augmentation
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── components.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm/bun package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nutriflow.git
cd nutriflow

# Install dependencies
bun install
# or
npm install

# Copy environment file
cp .env.example .env

# Generate a NextAuth secret
openssl rand -hex 32
# Add it to .env as NEXTAUTH_SECRET=...

# Push database schema
bun run db:push

# Seed the database (85 foods + 27 exercises)
bun run db:seed

# Start the dev server
bun run dev
# or
npm run dev
```

The app will be available at `http://localhost:3000`.

### Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server (port 3000) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push schema to SQLite |
| `bun run db:seed` | Seed foods + exercises |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:migrate` | Run migrations |
| `bun run db:reset` | Reset database |

## 🔐 Security Features

- **bcrypt password hashing** (cost factor 12)
- **JWT sessions** with HTTP-only cookies (30-day expiry)
- **Rate limiting** — 10 auth attempts / 15 min, 100 API requests / min, 10 AI requests / hour
- **Zod input validation** on every API endpoint
- **Timing attack mitigation** — constant-time-ish password verification on login miss
- **Service worker** never caches auth or user data (API requests go network-first)
- **No client-side secrets** — all sensitive operations server-side only

## 📱 PWA Features

- Installable on mobile/desktop (standalone display mode)
- Offline shell caching via service worker
- Safe-area insets for iOS notch
- Apple Web App capable with custom status bar
- App shortcuts (Dashboard, Food Diary, Add Food)

## 🏗 Architecture (SOLID)

Each service has a **single responsibility**:
- `AuthService` — registration + goal generation
- `FoodService` — catalog search + custom foods
- `DiaryService` — food log CRUD + daily aggregation
- `ExerciseService` — MET-based calorie calculation
- `WeightService` — weight history + user sync
- `WaterService` — daily intake upsert
- `GoalService` — active goal management
- `FastingService` — intermittent fasting sessions
- `StatsService` — dashboard composition
- `ProfileService` — biometrics + goal regeneration
- `RecipeService` — recipe CRUD + ingredients
- `RecipeLikeService` — likes + community browsing
- `RecipeRatingService` — 1-5 star ratings
- `RecipeCommentService` — comments
- `MealPlanService` — weekly plan + grocery list
- `MealPlanTemplateService` — 6 curated templates
- `FavoritesService` — food favorites + recent foods
- `RecommendationsService` — macro-based suggestions
- `NutritionScoreService` — composite health metric
- `InsightsService` — streaks + achievements
- `MilestonesService` — score milestones
- `LeaderboardService` — community ranking
- `WeeklySummaryService` — 7-day averages
- `GoalPredictionService` — linear regression projection
- `TipsService` — contextual nutrition advice
- `ImportService` / `ExportService` — data portability
- `MealVisionService` — VLM food recognition

API routes are **thin controllers** that call services.

## 📄 License

MIT — feel free to use this project for your own purposes.

## 🤝 Contributing

This is a demo project. Feel free to fork and customize!
