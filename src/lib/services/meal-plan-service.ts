import { db } from "@/lib/db";
import { z } from "zod";
import { toLocalDateString, addDays, parseLocalDate } from "@/lib/utils/date";

/**
 * MealPlanService — weekly meal planning + grocery list generation.
 * Single Responsibility: manage meal plan slots + aggregate ingredients.
 */

export const mealPlanSlotSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayIndex: z.number().int().min(0).max(6),
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  recipeId: z.string().cuid().optional(),
  customName: z.string().trim().max(120).optional(),
  servings: z.number().min(0.25).max(20).default(1),
});

export type MealPlanSlot = z.infer<typeof mealPlanSlotSchema>;

export interface MealPlanEntry {
  id: string;
  weekStartDate: string;
  dayIndex: number;
  meal: string;
  recipeId: string | null;
  recipeName: string | null;
  customName: string | null;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface GroceryItem {
  name: string;
  totalGrams: number;
  recipeCount: number;
  estimatedCalories: number;
}

export interface GroceryList {
  items: GroceryItem[];
  totalItems: number;
  totalCalories: number;
  weekStartDate: string;
}

export class MealPlanService {
  /**
   * Get the Monday of the week containing the given date.
   */
  static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? -6 : 1 - day; // Monday as start
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  static async getWeek(
    userId: string,
    weekStartDateStr: string,
  ): Promise<MealPlanEntry[]> {
    const weekStart = parseLocalDate(weekStartDateStr);
    const entries = await db.mealPlan.findMany({
      where: { userId, weekStartDate: weekStart },
      include: { recipe: true },
    });
    return entries.map((e) => ({
      id: e.id,
      weekStartDate: toLocalDateString(e.weekStartDate),
      dayIndex: e.dayIndex,
      meal: e.meal,
      recipeId: e.recipeId,
      recipeName: e.recipe?.name ?? null,
      customName: e.customName,
      servings: e.servings,
      calories: e.recipe ? Math.round(e.recipe.calories * e.servings) : 0,
      proteinG: e.recipe ? Math.round(e.recipe.proteinG * e.servings * 10) / 10 : 0,
      carbsG: e.recipe ? Math.round(e.recipe.carbsG * e.servings * 10) / 10 : 0,
      fatG: e.recipe ? Math.round(e.recipe.fatG * e.servings * 10) / 10 : 0,
    }));
  }

  static async upsertSlot(userId: string, input: unknown): Promise<MealPlanEntry> {
    const data = mealPlanSlotSchema.parse(input);
    const weekStart = parseLocalDate(data.weekStartDate);

    // Validate recipe ownership if recipeId provided
    if (data.recipeId) {
      const recipe = await db.recipe.findFirst({
        where: { id: data.recipeId, userId },
      });
      if (!recipe) throw new Error("RECIPE_NOT_FOUND");
    }

    const entry = await db.mealPlan.upsert({
      where: {
        userId_weekStartDate_dayIndex_meal: {
          userId,
          weekStartDate: weekStart,
          dayIndex: data.dayIndex,
          meal: data.meal,
        },
      },
      create: {
        userId,
        weekStartDate: weekStart,
        dayIndex: data.dayIndex,
        meal: data.meal,
        recipeId: data.recipeId ?? null,
        customName: data.customName ?? null,
        servings: data.servings,
      },
      update: {
        recipeId: data.recipeId ?? null,
        customName: data.customName ?? null,
        servings: data.servings,
      },
      include: { recipe: true },
    });

    return {
      id: entry.id,
      weekStartDate: toLocalDateString(entry.weekStartDate),
      dayIndex: entry.dayIndex,
      meal: entry.meal,
      recipeId: entry.recipeId,
      recipeName: entry.recipe?.name ?? null,
      customName: entry.customName,
      servings: entry.servings,
      calories: entry.recipe ? Math.round(entry.recipe.calories * entry.servings) : 0,
      proteinG: entry.recipe ? Math.round(entry.recipe.proteinG * entry.servings * 10) / 10 : 0,
      carbsG: entry.recipe ? Math.round(entry.recipe.carbsG * entry.servings * 10) / 10 : 0,
      fatG: entry.recipe ? Math.round(entry.recipe.fatG * entry.servings * 10) / 10 : 0,
    };
  }

  static async deleteSlot(userId: string, slotId: string): Promise<boolean> {
    const entry = await db.mealPlan.findFirst({ where: { id: slotId, userId } });
    if (!entry) return false;
    await db.mealPlan.delete({ where: { id: slotId } });
    return true;
  }

  static async clearWeek(userId: string, weekStartDateStr: string): Promise<number> {
    const weekStart = parseLocalDate(weekStartDateStr);
    const result = await db.mealPlan.deleteMany({
      where: { userId, weekStartDate: weekStart },
    });
    return result.count;
  }

  /**
   * Generate a grocery list by aggregating ingredients from all planned recipes.
   */
  static async generateGroceryList(
    userId: string,
    weekStartDateStr: string,
  ): Promise<GroceryList> {
    const weekStart = parseLocalDate(weekStartDateStr);
    const planEntries = await db.mealPlan.findMany({
      where: { userId, weekStartDate: weekStart, recipeId: { not: null } },
      include: { recipe: { include: { ingredients: true } } },
    });

    const groceryMap = new Map<string, { totalGrams: number; recipeCount: number; estimatedCalories: number }>();

    for (const entry of planEntries) {
      if (!entry.recipe) continue;
      const servingsMultiplier = entry.servings;
      for (const ing of entry.recipe.ingredients) {
        const key = ing.name.toLowerCase().trim();
        const grams = ing.quantityG * servingsMultiplier;
        const cals = ing.calories * servingsMultiplier;
        const existing = groceryMap.get(key);
        if (existing) {
          existing.totalGrams += grams;
          existing.recipeCount += 1;
          existing.estimatedCalories += cals;
        } else {
          groceryMap.set(key, {
            totalGrams: grams,
            recipeCount: 1,
            estimatedCalories: cals,
          });
        }
      }
    }

    const items = Array.from(groceryMap.entries())
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        totalGrams: Math.round(data.totalGrams),
        recipeCount: data.recipeCount,
        estimatedCalories: Math.round(data.estimatedCalories),
      }))
      .sort((a, b) => b.totalGrams - a.totalGrams);

    return {
      items,
      totalItems: items.length,
      totalCalories: items.reduce((s, i) => s + i.estimatedCalories, 0),
      weekStartDate: weekStartDateStr,
    };
  }

  /**
   * Auto-plan a week: fill empty slots with the user's recipes (cycling through them).
   */
  static async autoPlanWeek(
    userId: string,
    weekStartDateStr: string,
  ): Promise<number> {
    const recipes = await db.recipe.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    if (recipes.length === 0) throw new Error("NO_RECIPES");

    const weekStart = parseLocalDate(weekStartDateStr);
    const meals: Array<"breakfast" | "lunch" | "dinner" | "snack"> = [
      "breakfast",
      "lunch",
      "dinner",
    ];
    let recipeIndex = 0;
    let count = 0;

    for (let day = 0; day < 7; day++) {
      for (const meal of meals) {
        const existing = await db.mealPlan.findUnique({
          where: {
            userId_weekStartDate_dayIndex_meal: {
              userId,
              weekStartDate: weekStart,
              dayIndex: day,
              meal,
            },
          },
        });
        if (existing) continue;
        const recipe = recipes[recipeIndex % recipes.length];
        recipeIndex++;
        await db.mealPlan.create({
          data: {
            userId,
            weekStartDate: weekStart,
            dayIndex: day,
            meal,
            recipeId: recipe.id,
            servings: 1,
          },
        });
        count++;
      }
    }
    return count;
  }
}
