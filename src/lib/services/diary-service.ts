import { db } from "@/lib/db";
import { foodLogCreateSchema, foodLogUpdateSchema } from "@/lib/validators";
import { parseLocalDate, toLocalDateString } from "@/lib/utils/date";
import { FavoritesService } from "./favorites-service";

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface DiaryDay {
  date: string;
  consumed: NutritionTotals;
  burned: number;
  logs: Array<{
    id: string;
    meal: string;
    foodName: string;
    quantityG: number;
    servings: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

/**
 * DiaryService — food log CRUD + daily aggregation.
 * Single Responsibility: food diary entries and computed totals.
 */
export class DiaryService {
  static async addLog(userId: string, input: unknown) {
    const data = foodLogCreateSchema.parse(input);
    const date = new Date(data.date);

    // resolve food source
    let source:
      | { type: "food"; foodId: string; name: string; per100: NutritionTotals; servingG: number }
      | { type: "custom"; customFoodId: string; name: string; per100: NutritionTotals; servingG: number }
      | null = null;

    if (data.foodId) {
      const f = await db.food.findUnique({ where: { id: data.foodId } });
      if (!f) throw new Error("FOOD_NOT_FOUND");
      source = {
        type: "food",
        foodId: f.id,
        name: f.name,
        servingG: f.defaultServingG,
        per100: {
          calories: f.caloriesPer100g,
          protein: f.proteinPer100g,
          carbs: f.carbsPer100g,
          fat: f.fatPer100g,
          fiber: f.fiberPer100g ?? 0,
          sugar: f.sugarPer100g ?? 0,
          sodium: f.sodiumPer100g ?? 0,
        },
      };
    } else if (data.customFoodId) {
      const f = await db.customFood.findFirst({
        where: { id: data.customFoodId, userId },
      });
      if (!f) throw new Error("FOOD_NOT_FOUND");
      source = {
        type: "custom",
        customFoodId: f.id,
        name: f.name,
        servingG: f.defaultServingG,
        per100: {
          calories: f.caloriesPer100g,
          protein: f.proteinPer100g,
          carbs: f.carbsPer100g,
          fat: f.fatPer100g,
          fiber: f.fiberPer100g ?? 0,
          sugar: f.sugarPer100g ?? 0,
          sodium: f.sodiumPer100g ?? 0,
        },
      };
    }
    if (!source) throw new Error("FOOD_NOT_FOUND");

    const factor = data.quantityG / 100;
    const servings = data.quantityG / source.servingG;
    const log = await db.foodLog.create({
      data: {
        userId,
        date,
        meal: data.meal,
        foodId: source.type === "food" ? source.foodId : null,
        customFoodId: source.type === "custom" ? source.customFoodId : null,
        foodName: source.name,
        quantityG: data.quantityG,
        servings,
        calories: Math.round(source.per100.calories * factor),
        proteinG: Math.round(source.per100.protein * factor * 10) / 10,
        carbsG: Math.round(source.per100.carbs * factor * 10) / 10,
        fatG: Math.round(source.per100.fat * factor * 10) / 10,
        fiberG: source.per100.fiber
          ? Math.round(source.per100.fiber * factor * 10) / 10
          : null,
      },
    });
    // Auto-track favorite for quick-add (non-blocking, ignore errors)
    FavoritesService.trackFromLog(userId, {
      foodId: source.type === "food" ? source.foodId : null,
      customFoodId: source.type === "custom" ? source.customFoodId : null,
      foodName: source.name,
      quantityG: data.quantityG,
      meal: data.meal,
    }).catch(() => {});
    return log;
  }

  static async updateLog(userId: string, logId: string, input: unknown) {
    const data = foodLogUpdateSchema.parse(input);
    const log = await db.foodLog.findFirst({ where: { id: logId, userId } });
    if (!log) throw new Error("LOG_NOT_FOUND");

    // recompute from new quantity
    const base = await this.resolveBase(userId, log);
    const factor = data.quantityG / 100;
    const servings = data.quantityG / base.servingG;
    return db.foodLog.update({
      where: { id: logId },
      data: {
        quantityG: data.quantityG,
        servings,
        calories: Math.round(base.per100.calories * factor),
        proteinG: Math.round(base.per100.protein * factor * 10) / 10,
        carbsG: Math.round(base.per100.carbs * factor * 10) / 10,
        fatG: Math.round(base.per100.fat * factor * 10) / 10,
        fiberG: base.per100.fiber
          ? Math.round(base.per100.fiber * factor * 10) / 10
          : null,
      },
    });
  }

  private static async resolveBase(
    userId: string,
    log: { foodId: string | null; customFoodId: string | null },
  ) {
    if (log.foodId) {
      const f = await db.food.findUnique({ where: { id: log.foodId } });
      if (!f) throw new Error("FOOD_NOT_FOUND");
      return {
        servingG: f.defaultServingG,
        per100: {
          calories: f.caloriesPer100g,
          protein: f.proteinPer100g,
          carbs: f.carbsPer100g,
          fat: f.fatPer100g,
          fiber: f.fiberPer100g ?? 0,
        },
      };
    }
    const f = await db.customFood.findFirst({
      where: { id: log.customFoodId!, userId },
    });
    if (!f) throw new Error("FOOD_NOT_FOUND");
    return {
      servingG: f.defaultServingG,
      per100: {
        calories: f.caloriesPer100g,
        protein: f.proteinPer100g,
        carbs: f.carbsPer100g,
        fat: f.fatPer100g,
        fiber: f.fiberPer100g ?? 0,
      },
    };
  }

  static async deleteLog(userId: string, logId: string) {
    const log = await db.foodLog.findFirst({ where: { id: logId, userId } });
    if (!log) return false;
    await db.foodLog.delete({ where: { id: logId } });
    return true;
  }

  static async getDay(userId: string, dateStr: string): Promise<DiaryDay> {
    const date = parseLocalDate(dateStr);
    const start = date;
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const logs = await db.foodLog.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
    });

    const totals: NutritionTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };
    for (const l of logs) {
      totals.calories += l.calories;
      totals.protein += l.proteinG;
      totals.carbs += l.carbsG;
      totals.fat += l.fatG;
      totals.fiber += l.fiberG ?? 0;
    }

    return {
      date: dateStr,
      consumed: totals,
      burned: 0,
      logs: logs.map((l) => ({
        id: l.id,
        meal: l.meal,
        foodName: l.foodName,
        quantityG: l.quantityG,
        servings: l.servings,
        calories: l.calories,
        protein: l.proteinG,
        carbs: l.carbsG,
        fat: l.fatG,
      })),
    };
  }

  static async getRange(userId: string, startDateStr: string, days: number) {
    const start = parseLocalDate(startDateStr);
    const end = addDaysLocal(start, days);
    const logs = await db.foodLog.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    });
    // group by day
    const byDay = new Map<string, NutritionTotals>();
    for (const l of logs) {
      const key = toLocalDateString(l.date);
      const cur = byDay.get(key) ?? {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      };
      cur.calories += l.calories;
      cur.protein += l.proteinG;
      cur.carbs += l.carbsG;
      cur.fat += l.fatG;
      cur.fiber += l.fiberG ?? 0;
      byDay.set(key, cur);
    }
    const result: Array<{ date: string } & NutritionTotals> = [];
    for (let i = 0; i < days; i++) {
      const d = addDaysLocal(start, i);
      const key = toLocalDateString(d);
      const t = byDay.get(key) ?? {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      };
      result.push({ date: key, ...t });
    }
    return result;
  }
}

function addDaysLocal(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
