```markdown
# Roadmap

Current development plan for NutriFlow, organized in 6 phases. Each phase ends with a working, deployable version.

---

## ✅ Phase 1 — Navigation & Structure (DONE)

**Goal:** Reduce from 8 views to 5 tabs + profile. Reorganize into SOLID-compliant folders.

**Status:** Complete — committed 2026-09-18.

- ✅ Reorganize `views/` into single-responsibility folders:
  - `diary/` — 8 files (index, meals-section, food-search-dialog, food-detail, custom-food-creator, exercise-section, exercise-add-dialog, constants)
  - `progress/` — 5 files (index, weight-section, add-weight-dialog, achievements-section, stat-card)
  - `plan/` — 10 files (index, week-plan-section, meal-slot, recipes-section, recipe-card, log-recipe-dialog, recipe-creator, grocery-list-dialog, templates-dialog, constants)
- ✅ New 5-tab navigation: **Hoy | Diario | Progreso | Plan | Reportes**
- ✅ Merged exercise into diary (internal tabs)
- ✅ Merged insights into progress (internal tabs)
- ✅ Merged meal plan + recipes into plan (internal tabs)
- ✅ Moved non-essential views to `_hidden/` (kept as reference):
  - Community recipes
  - Leaderboard
  - Recommendations
  - AI meal photo analyzer
  - Import/export JSON
- ✅ All UI text in Spanish
- ✅ Migrated database from SQLite to Postgres (Neon)

---

## ⏳ Phase 2 — Barcode Model C (IN PROGRESS)

**Goal:** Hybrid barcode lookup: local DB → OpenFoodFacts API → manual entry. iOS camera support.

**Why:** Most consumed products are global brands (Coca-Cola, Bimbo, Lala, etc.). OpenFoodFacts covers them well. Local cache makes re-scans instant.

**Tasks:**

- ⏳ Create `OpenFoodFactsService` for external lookup
- ⏳ Update `FoodService.getByBarcode` to: local → OFacts → cache → return
- ⏳ Replace `BarcodeDetector` with `@zxing/browser` (works on iOS Safari)
- ⏳ Add inline "create custom food" form when barcode not found
- ⏳ Cache OFacts results in `Food` table for future lookups
- ⏳ Test with representative products (Coca-Cola, Bimbo, Lala, etc.)

---

## ⏳ Phase 3 — Reports (PENDING)

**Goal:** PDF + CSV export by date range.

**Tasks:**

- Add `ReportsService` for data aggregation
- Add `/api/reports/csv` and `/api/reports/data` endpoints
- Add PDF template with `@react-pdf/renderer`
- Build Reports view with date picker

**Report contents:**

- Summary (avg kcal, macros, water, weight)
- Daily calories chart
- Meals table
- Weight trend chart
- Fasting totals
- Exercise totals

---

## ⏳ Phase 4 — Empathetic UX (PENDING)

**Goal:** Rewrite all motivational messages with a supportive, non-judgmental tone.

**Tasks:**

- Rewrite milestones (achievements) messages
- Rewrite insights (streaks, adherence) messages
- Rewrite nutrition score messages
- Rewrite tips messages
- Rewrite goal prediction messages

**Principles:**

- No punitive language ("you failed", "you exceeded")
- Focus on progress, not perfection
- Context-aware ("this week was harder, that's okay")
- Celebrate small wins

---

## ⏳ Phase 5 — i18n (PENDING)

**Goal:** Bilingual app (Spanish default, English available).

**Tasks:**

- Configure `next-intl` with routing
- Move `app/` into `app/[locale]/`
- Create `messages/es.json` and `messages/en.json`
- Add language switcher in profile
- Locale-aware date and number formatting
- Verify PWA detects system language

---

## ⏳ Phase 6 — Deploy (PENDING)

**Goal:** Production deployment + PWA install + user guide.

**Tasks:**

- Deploy to Vercel
- Configure environment variables (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
- Production seed with Mexican foods
- Verify PWA on iOS + Android
- Write user guide in Spanish (`docs/USER_GUIDE.md`)
- Set up Sentry for error monitoring
- Migrate from in-memory rate limiter to Redis (Upstash)

---

## Long-term (post-MVP)

Not planned yet, but possible directions:

- Redis-backed rate limiting (for multi-instance production)
- Email password reset
- Email verification
- Multi-user mode (family/friends)
- Export to Apple Health / Google Fit
- AI nutritionist chat (opt-in)
- B2B edition for nutritionists (multi-patient dashboard)

---

## Testing Strategy (planned, post-Phase 6)

No automated tests yet. Planned for after MVP ships:

- **Unit tests** (Vitest) for:
  - `GoalPredictionService` — regression edge cases (0 weights, 1 weight, equal weights, upward vs downward trends)
  - `WeeklySummaryService` — trend calculation with partial weeks
  - `NutritionScoreService` — composite scoring
  - `RateLimiter` — window behavior
- **Integration tests** for API routes (with test DB)
- **E2E tests** (Playwright) for critical flows: register → log food → see dashboard