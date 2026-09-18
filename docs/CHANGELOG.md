```markdown
# Changelog

All notable changes to NutriFlow. Follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### In Progress
- Phase 2: Barcode Model C (hybrid lookup with OpenFoodFacts + iOS camera support via @zxing/browser)

---

## [0.3.0] — 2026-09-18

### Added
- `docs/ROADMAP.md` — 6-phase development plan with current status
- `docs/ARCHITECTURE.md` — technical decisions and folder structure
- `CHANGELOG.md` — this file
- `views/_hidden/README.md` — explains purpose of hidden views

### Changed
- `README.md` — rewritten to reflect personal-edition state (was describing original full-feature build)

---

## [0.2.0] — 2026-09-18

### Changed
- **BREAKING:** View navigation reduced from 8 views to 5 tabs + profile
  - New tabs: **Hoy | Diario | Progreso | Plan | Reportes**
  - Old views (`exercise`, `insights`, `mealplan`, `recipes`) merged into new tabs or hidden
- Reorganized `views/` into single-responsibility folders (SOLID):
  - `diary/` — 8 files
  - `progress/` — 5 files
  - `plan/` — 10 files
- All UI text now in Spanish
- Migrated database from SQLite to Postgres (Neon)

### Added
- `views/_hidden/` folder for removed-from-nav views (exercise, insights, meal-plan, recipes)
- `views/reports.tsx` placeholder (real implementation in Phase 3)

### Hidden (code kept, removed from navigation)
- Community recipes tab
- Leaderboard card
- Recommendations card
- AI meal photo analyzer
- Import/export JSON from profile menu

### Fixed
- `weekly-summary-service`: trend calculation now uses consistent day basis (was comparing per-day avg vs per-7-day avg)
- `weekly-summary-service`: `bestDay` now goal-aware (was always highest-calorie day)
- `goal-prediction-service`: returns early on zero-denominator regression (was producing nonsensical slopes)
- `dashboard.tsx`: guard against undefined `consumed` macros
- `meal-plan.tsx`: added response types to mutations
- `recipes.tsx`: added response type to like mutation
- `exercise-service.ts`: widened `exerciseId` type to accept `null`
- `favorites-service.ts`: hoisted `foodId`/`customFoodId` out of `try` block
- `import-service.ts`: added runtime type guards for imported bundles
- `recommendations-service.ts`: separated typed array declaration from sort
- Removed `ignoreBuildErrors` — all TypeScript errors surfaced and fixed

---

## [0.1.0] — 2026-09-17

### Added
- Initial commit with full application
- 44 API routes
- 25+ services
- Auth (NextAuth v4, bcrypt cost 12, JWT)
- Food diary, macro tracking, weight, water, fasting, exercise
- Meal planning, recipes, community recipes
- Nutrition score, milestones, insights, leaderboard
- PWA manifest + service worker
- Bilingual-ready (i18n not yet configured)

### Known Issues (fixed in later releases)
- `ignoreBuildErrors` enabled (masked 8 TypeScript errors)
- Weekly trend calculation bug
- Best day calculation bug
- Zero-denominator crash in goal prediction