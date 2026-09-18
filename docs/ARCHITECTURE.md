# Architecture

Technical decisions and structure of NutriFlow.

---

## Principles

### SOLID

The project follows **SOLID principles** at the service and component level.

- **Single Responsibility:** Every file has one reason to change
  - Example: `diary/index.tsx` only orchestrates tabs; `meals-section.tsx` handles meals; `exercise-section.tsx` handles exercise
- **Open/Closed:** Services are open for extension via new methods, closed to modification
- **Liskov Substitution:** All services follow static method conventions
- **Interface Segregation:** Types are small and focused (e.g., `DailyNutrition` vs `WeeklySummary`)
- **Dependency Inversion:** Components depend on `api` client abstractions, not raw fetch

### Layered Architecture
──────────────────────────────────────┐
│ UI (React components) │ ← presentational
├──────────────────────────────────────┤
│ Hooks / Queries (TanStack Query) │ ← client state
├──────────────────────────────────────┤
│ API Routes (/app/api/) │ ← HTTP layer
├──────────────────────────────────────┤
│ Services (lib/services/) │ ← business logic
├──────────────────────────────────────┤
│ Prisma (lib/db.ts) │ ← data access
├──────────────────────────────────────┤
│ Postgres (Neon) │ ← persistence
└──────────────────────────────────────┘


**Rule:** Each layer only talks to the one directly below it. UI never imports services directly — it calls API routes via `api.get/post/del`.

---

## Folder Structure

### `src/app/api/`

Next.js App Router API routes. Each route is thin — it validates input, calls a service, returns a response.

```ts
// Example: /api/prediction/route.ts
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const result = await GoalPredictionService.predict(user.id);
  return ok(result);
}

Rule: Route handlers should be <15 lines. Complex logic lives in lib/services/.

src/lib/services/
Business logic organized by domain. Each service is a class with static methods.

DiaryService — food log CRUD

ExerciseService — MET-based calorie calculation

WeeklySummaryService — 7-day averages + trends

GoalPredictionService — linear regression on weight logs

NutritionScoreService — composite score (0-100)

RecommendationsService — macro-based suggestions

MealPlanService — weekly plan + grocery list

...and ~18 more

Rule: Services never import React. Services never touch the DOM. Pure logic.

src/components/app/views/
Screen-level components organized by tab. Each view folder is a mini-app.

diary/
├── index.tsx                 # Orchestrator (tabs)
├── meals-section.tsx         # Responsibility: meals
├── food-search-dialog.tsx    # Responsibility: search UI
├── food-detail.tsx           # Responsibility: single food
├── custom-food-creator.tsx   # Responsibility: create custom food
├── exercise-section.tsx      # Responsibility: exercise
├── exercise-add-dialog.tsx   # Responsibility: add exercise
└── constants.ts              # Shared constants

Rule: index.tsx orchestrates. Sub-components live in their own files. No file >300 lines.

src/components/app/views/_hidden/
Views removed from navigation but kept for reference. Do not delete — they contain working code that may be restored.

Hidden features: exercise (v1), insights (v1), meal-plan (v1), recipes (v1).

Data Flow
Reading data

User opens /diary
  ↓
DiaryView reads from Zustand store (selectedDate, view)
  ↓
TanStack Query fires GET /api/diary?date=...
  ↓
Route handler → DiaryService.getDay()
  ↓
Prisma query → Postgres
  ↓
Response → Query cache → React re-render

Writing data

User logs food
  ↓
Component calls api.post("/api/diary", {...})
  ↓
Route validates with Zod schema
  ↓
DiaryService.addLog() → Prisma insert
  ↓
Component invalidates queries: ["diary", date], ["dashboard", date]
  ↓
TanStack Query refetches affected views

Key Decisions
Why Postgres over SQLite?
Vercel's serverless functions have ephemeral filesystems — SQLite doesn't persist. Postgres (via Neon) is stable, free at our scale, and supports concurrent connections.

Why NextAuth v4 (not v5)?
NextAuth v5 (Auth.js) is still in beta. v4 is stable and well-documented.

Why JWT sessions (not DB sessions)?
Stateless sessions scale better and don't require a DB roundtrip on every request. Trade-off: no server-side revocation (acceptable for this project).

Why TanStack Query (not SWR)?
Better cache invalidation API (invalidateQueries), better TypeScript support, mutation states built-in.

Why Zustand (not Context)?
Context re-renders the whole tree on every change. Zustand only re-renders subscribed components. Critical for a 13+ card dashboard.

Why _hidden/ folder (not delete)?
Working code that might be restored. Common pattern in personal projects: don't delete, hide.

Why Spanish-first?
The app was built for a Spanish-speaking user. English will be added in Phase 5 as a secondary locale.

Environment
Required
Var	Purpose
DATABASE_URL	Postgres connection string (Neon pooler for Vercel)
NEXTAUTH_SECRET	JWT signing key (min 32 chars)
NEXTAUTH_URL	Full URL of the deployment
Optional
Var	Purpose
ZAI_API_KEY	AI meal photo analyzer (feature hidden, not used)
Performance Notes
Turbopack enabled for dev (fast HMR)

serverExternalPackages for Prisma (avoids Turbopack bundling issues)

Query caching — TanStack Query keeps stale data for 5 min by default

Optimistic updates — not yet used; consider for high-frequency actions (water, food log)

Known Limitations
Rate limiter is in-memory (doesn't work across serverless instances) — fix in Phase 6

No password reset flow

No email verification

No server-side session revocation

No automated test coverage yet

/api/ai/analyze-meal endpoint exists but UI is hidden (no ZAI_API_KEY set)

Testing Strategy (planned)
See ROADMAP.md.