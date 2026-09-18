import { db } from "@/lib/db";
import { PasswordHasher } from "@/lib/auth/password";
import type { ExportBundle } from "./export-service";

/**
 * ImportService — data import (JSON bundle) for user migration.
 * Single Responsibility: parse export bundle + create records.
 * Only imports into the CURRENT user's account (no cross-user data).
 */

export interface ImportResult {
  imported: {
    foodLogs: number;
    exerciseLogs: number;
    weightLogs: number;
    waterLogs: number;
    recipes: number;
    goals: number;
  };
  skipped: number;
  errors: string[];
}

export class ImportService {
  /**
   * Import a JSON bundle into the current user's account.
   * Does NOT import user profile (keeps current profile) or auth data.
   */
  static async importBundle(userId: string, raw: unknown): Promise<ImportResult> {
    const result: ImportResult = {
      imported: { foodLogs: 0, exerciseLogs: 0, weightLogs: 0, waterLogs: 0, recipes: 0, goals: 0 },
      skipped: 0,
      errors: [],
    };

    if (!raw || typeof raw !== "object") {
      throw new Error("INVALID_FORMAT");
    }
    const bundle = raw as Partial<ExportBundle>;
    if (!bundle || !bundle.user) {
      throw new Error("INVALID_FORMAT");
    }

    // Import weight logs (upsert by date)
    if (Array.isArray(bundle.weightLogs)) {
      for (const w of bundle.weightLogs) {
        try {
          if (!w || typeof w.date !== "string" || typeof w.weightKg !== "number") {
            result.skipped++;
            continue;
          }
          const date = new Date(w.date);
          await db.weightLog.upsert({
            where: { userId_date: { userId, date } },
            create: { userId, date, weightKg: w.weightKg, note: w.note ?? null },
            update: { weightKg: w.weightKg, note: w.note ?? null },
          });
          result.imported.weightLogs++;
        } catch {
          result.skipped++;
        }
      }
    }

    // Import water logs (upsert by date)
    if (Array.isArray(bundle.waterLogs)) {
      for (const w of bundle.waterLogs) {
        try {
          if (!w || typeof w.date !== "string" || typeof w.amountMl !== "number") {
            result.skipped++;
            continue;
          }
          const date = new Date(w.date);
          await db.waterLog.upsert({
            where: { userId_date: { userId, date } },
            create: { userId, date, amountMl: w.amountMl },
            update: { amountMl: w.amountMl },
          });
          result.imported.waterLogs++;
        } catch {
          result.skipped++;
        }
      }
    }

    // Import food logs (create new, don't deduplicate)
    if (Array.isArray(bundle.foodLogs)) {
      for (const f of bundle.foodLogs) {
        try {
          if (!f || typeof f.date !== "string" || typeof f.calories !== "number") {
            result.skipped++;
            continue;
          }
          await db.foodLog.create({
            data: {
              userId,
              date: new Date(f.date),
              meal: f.meal ?? "snack",
              foodId: null,
              customFoodId: null,
              foodName: f.foodName ?? "Imported food",
              quantityG: f.quantityG ?? 100,
              servings: f.servings ?? 1,
              calories: f.calories,
              proteinG: f.proteinG ?? 0,
              carbsG: f.carbsG ?? 0,
              fatG: f.fatG ?? 0,
              fiberG: f.fiberG ?? null,
            },
          });
          result.imported.foodLogs++;
        } catch {
          result.skipped++;
        }
      }
    }

    // Import exercise logs
    if (Array.isArray(bundle.exerciseLogs)) {
      for (const e of bundle.exerciseLogs) {
        try {
          if (!e || typeof e.date !== "string" || typeof e.caloriesBurned !== "number") {
            result.skipped++;
            continue;
          }
          await db.exerciseLog.create({
            data: {
              userId,
              date: new Date(e.date),
              exerciseId: null,
              exerciseName: e.exerciseName ?? "Imported exercise",
              durationMin: e.durationMin ?? 30,
              caloriesBurned: e.caloriesBurned,
            },
          });
          result.imported.exerciseLogs++;
        } catch {
          result.skipped++;
        }
      }
    }

    // Import recipes (create new with ingredients)
    if (Array.isArray(bundle.recipes)) {
      for (const r of bundle.recipes) {
        try {
          if (!r || typeof r.name !== "string") {
            result.skipped++;
            continue;
          }
          const created = await db.recipe.create({
            data: {
              userId,
              name: r.name,
              description: r.description ?? null,
              servings: r.servings ?? 1,
              calories: r.calories ?? 0,
              proteinG: r.proteinG ?? 0,
              carbsG: r.carbsG ?? 0,
              fatG: r.fatG ?? 0,
              isPublic: false, // always private on import
            },
          });
          if (Array.isArray(r.ingredients)) {
            for (const ing of r.ingredients) {
              if (!ing || typeof ing.name !== "string") continue;
              await db.recipeIngredient.create({
                data: {
                  recipeId: created.id,
                  foodId: null,
                  name: ing.name,
                  quantityG: ing.quantityG ?? 100,
                  calories: ing.calories ?? 0,
                  proteinG: ing.proteinG ?? 0,
                  carbsG: ing.carbsG ?? 0,
                  fatG: ing.fatG ?? 0,
                },
              });
            }
          }
          result.imported.recipes++;
        } catch {
          result.skipped++;
        }
      }
    }

    // Import goals (deactivate existing, create new active)
    if (Array.isArray(bundle.goals) && bundle.goals.length > 0) {
      try {
        const g = bundle.goals[0]; // import only the most recent goal
        if (g && typeof g.calorieGoal === "number") {
          await db.goal.updateMany({
            where: { userId, active: true },
            data: { active: false },
          });
          await db.goal.create({
            data: {
              userId,
              calorieGoal: g.calorieGoal,
              proteinGoalG: g.proteinGoalG ?? 0,
              carbGoalG: g.carbGoalG ?? 0,
              fatGoalG: g.fatGoalG ?? 0,
              waterGoalMl: g.waterGoalMl ?? 2000,
              weightGoalKg: g.weightGoalKg ?? null,
              active: true,
            },
          });
          result.imported.goals++;
        }
      } catch {
        result.skipped++;
      }
    }

    return result;
  }

  // Keep PasswordHasher referenced for clarity (not used in import)
  static _unused = PasswordHasher;
}
