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

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as RawRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
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
      for (const rawItem of bundle.weightLogs) {
        try {
          const w = asRecord(rawItem);
          if (!w) {
            result.skipped++;
            continue;
          }
          const dateStr = asString(w.date);
          const weightKg = asNumber(w.weightKg);
          if (!dateStr || weightKg === null) {
            result.skipped++;
            continue;
          }
          const date = new Date(dateStr);
          await db.weightLog.upsert({
            where: { userId_date: { userId, date } },
            create: { userId, date, weightKg, note: asStringOrNull(w.note) },
            update: { weightKg, note: asStringOrNull(w.note) },
          });
          result.imported.weightLogs++;
        } catch {
          result.skipped++;
        }
      }
    }

    // Import water logs (upsert by date)
    if (Array.isArray(bundle.waterLogs)) {
      for (const rawItem of bundle.waterLogs) {
        try {
          const w = asRecord(rawItem);
          if (!w) {
            result.skipped++;
            continue;
          }
          const dateStr = asString(w.date);
          const amountMl = asNumber(w.amountMl);
          if (!dateStr || amountMl === null) {
            result.skipped++;
            continue;
          }
          const date = new Date(dateStr);
          await db.waterLog.upsert({
            where: { userId_date: { userId, date } },
            create: { userId, date, amountMl },
            update: { amountMl },
          });
          result.imported.waterLogs++;
        } catch {
          result.skipped++;
        }
      }
    }

    // Import food logs (create new, don't deduplicate)
    if (Array.isArray(bundle.foodLogs)) {
      for (const rawItem of bundle.foodLogs) {
        try {
          const f = asRecord(rawItem);
          if (!f) {
            result.skipped++;
            continue;
          }
          const dateStr = asString(f.date);
          const calories = asNumber(f.calories);
          if (!dateStr || calories === null) {
            result.skipped++;
            continue;
          }
          await db.foodLog.create({
            data: {
              userId,
              date: new Date(dateStr),
              meal: asString(f.meal) ?? "snack",
              foodId: null,
              customFoodId: null,
              foodName: asString(f.foodName) ?? "Imported food",
              quantityG: asNumber(f.quantityG) ?? 100,
              servings: asNumber(f.servings) ?? 1,
              calories,
              proteinG: asNumber(f.proteinG) ?? 0,
              carbsG: asNumber(f.carbsG) ?? 0,
              fatG: asNumber(f.fatG) ?? 0,
              fiberG: asNumber(f.fiberG),
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
      for (const rawItem of bundle.exerciseLogs) {
        try {
          const e = asRecord(rawItem);
          if (!e) {
            result.skipped++;
            continue;
          }
          const dateStr = asString(e.date);
          const caloriesBurned = asNumber(e.caloriesBurned);
          if (!dateStr || caloriesBurned === null) {
            result.skipped++;
            continue;
          }
          await db.exerciseLog.create({
            data: {
              userId,
              date: new Date(dateStr),
              exerciseId: null,
              exerciseName: asString(e.exerciseName) ?? "Imported exercise",
              durationMin: asNumber(e.durationMin) ?? 30,
              caloriesBurned,
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
      for (const rawItem of bundle.recipes) {
        try {
          const r = asRecord(rawItem);
          if (!r) {
            result.skipped++;
            continue;
          }
          const name = asString(r.name);
          if (!name) {
            result.skipped++;
            continue;
          }
          const created = await db.recipe.create({
            data: {
              userId,
              name,
              description: asStringOrNull(r.description),
              servings: asNumber(r.servings) ?? 1,
              calories: asNumber(r.calories) ?? 0,
              proteinG: asNumber(r.proteinG) ?? 0,
              carbsG: asNumber(r.carbsG) ?? 0,
              fatG: asNumber(r.fatG) ?? 0,
              isPublic: false, // always private on import
            },
          });
          if (Array.isArray(r.ingredients)) {
            for (const rawIng of r.ingredients) {
              const ing = asRecord(rawIng);
              if (!ing) continue;
              const ingName = asString(ing.name);
              if (!ingName) continue;
              await db.recipeIngredient.create({
                data: {
                  recipeId: created.id,
                  foodId: null,
                  name: ingName,
                  quantityG: asNumber(ing.quantityG) ?? 100,
                  calories: asNumber(ing.calories) ?? 0,
                  proteinG: asNumber(ing.proteinG) ?? 0,
                  carbsG: asNumber(ing.carbsG) ?? 0,
                  fatG: asNumber(ing.fatG) ?? 0,
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
        const g = asRecord(bundle.goals[0]); // import only the most recent goal
        const calorieGoal = g ? asNumber(g.calorieGoal) : null;
        if (g && calorieGoal !== null) {
          await db.goal.updateMany({
            where: { userId, active: true },
            data: { active: false },
          });
          await db.goal.create({
            data: {
              userId,
              calorieGoal,
              proteinGoalG: asNumber(g.proteinGoalG) ?? 0,
              carbGoalG: asNumber(g.carbGoalG) ?? 0,
              fatGoalG: asNumber(g.fatGoalG) ?? 0,
              waterGoalMl: asNumber(g.waterGoalMl) ?? 2000,
              weightGoalKg: asNumber(g.weightGoalKg),
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