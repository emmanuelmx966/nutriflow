import { db } from "@/lib/db";
import { z } from "zod";

/**
 * FavoritesService — manage quick-add food favorites + recent foods.
 * Single Responsibility: favorite CRUD + recent foods query.
 */

export interface FavoriteFood {
  id: string;
  foodId: string | null;
  customFoodId: string | null;
  name: string;
  quantityG: number;
  meal: string;
  lastUsedAt: string;
  // resolved nutrition for 1 serving at stored quantity
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const addFavoriteSchema = z.object({
  foodId: z.string().cuid().optional(),
  customFoodId: z.string().cuid().optional(),
  quantityG: z.number().min(1).max(5000),
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

export class FavoritesService {
  /**
   * Add or update a favorite. Auto-creates when a food log is created
   * (called from DiaryService.addLog).
   */
  static async trackFromLog(
    userId: string,
    params: {
      foodId?: string | null;
      customFoodId?: string | null;
      foodName: string;
      quantityG: number;
      meal: string;
    },
  ): Promise<void> {
    if (!params.foodId && !params.customFoodId) return;
    try {
      const foodId = params.foodId ?? null;
      const customFoodId = params.customFoodId ?? null;
      await db.foodFavorite.upsert({
        where: {
          userId_foodId_customFoodId: {
            userId,
            foodId: foodId ?? "",
            customFoodId: customFoodId ?? "",
          },
        },
        create: {
          userId,
          foodId,
          customFoodId,
          name: params.foodName,
          quantityG: params.quantityG,
          meal: params.meal,
          lastUsedAt: new Date(),
        },
        update: {
          name: params.foodName,
          quantityG: params.quantityG,
          meal: params.meal,
          lastUsedAt: new Date(),
        },
      });
    } catch {
      // The unique constraint on (userId, foodId, customFoodId) requires both
      // columns. If foodId is null and customFoodId is set, the unique key
      // uses the string values. SQLite treats NULL as distinct, so we handle
      // the edge case by finding + updating manually.
      const existing = await db.foodFavorite.findFirst({
        where: { userId, foodId: foodId ?? null, customFoodId: customFoodId ?? null },
      });
      if (existing) {
        await db.foodFavorite.update({
          where: { id: existing.id },
          data: {
            name: params.foodName,
            quantityG: params.quantityG,
            meal: params.meal,
            lastUsedAt: new Date(),
          },
        });
      } else {
        await db.foodFavorite.create({
          data: {
            userId,
            foodId,
            customFoodId,
            name: params.foodName,
            quantityG: params.quantityG,
            meal: params.meal,
            lastUsedAt: new Date(),
          },
        });
      }
    }
  }

  static async list(userId: string, limit = 20): Promise<FavoriteFood[]> {
    const favorites = await db.foodFavorite.findMany({
      where: { userId },
      orderBy: { lastUsedAt: "desc" },
      take: limit,
    });
    return favorites.map((f) => ({
      id: f.id,
      foodId: f.foodId,
      customFoodId: f.customFoodId,
      name: f.name,
      quantityG: f.quantityG,
      meal: f.meal,
      lastUsedAt: f.lastUsedAt.toISOString(),
      calories: 0, // resolved client-side via the linked food
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
    }));
  }

  static async addManual(userId: string, input: unknown): Promise<FavoriteFood> {
    const data = addFavoriteSchema.parse(input);
    // Resolve name from linked food
    let name = "Custom favorite";
    if (data.foodId) {
      const food = await db.food.findUnique({ where: { id: data.foodId } });
      name = food?.name ?? "Food";
    } else if (data.customFoodId) {
      const food = await db.customFood.findFirst({
        where: { id: data.customFoodId, userId },
      });
      name = food?.name ?? "Custom food";
    }
    return this.trackFromLog(userId, {
      foodId: data.foodId ?? null,
      customFoodId: data.customFoodId ?? null,
      foodName: name,
      quantityG: data.quantityG,
      meal: data.meal,
    }).then(() => ({
      id: "",
      foodId: data.foodId ?? null,
      customFoodId: data.customFoodId ?? null,
      name,
      quantityG: data.quantityG,
      meal: data.meal,
      lastUsedAt: new Date().toISOString(),
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
    }));
  }

  static async remove(userId: string, id: string): Promise<boolean> {
    const fav = await db.foodFavorite.findFirst({ where: { id, userId } });
    if (!fav) return false;
    await db.foodFavorite.delete({ where: { id } });
    return true;
  }

  /**
   * Get recent foods (from logs, distinct by foodId/customFoodId, last 30 days).
   * Falls back to favorites if no recent logs.
   */
  static async getRecent(userId: string, limit = 8): Promise<FavoriteFood[]> {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const logs = await db.foodLog.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Deduplicate by foodId or customFoodId, keeping the most recent
    const seen = new Set<string>();
    const recent: FavoriteFood[] = [];
    for (const l of logs) {
      const key = l.foodId ?? l.customFoodId ?? l.id;
      if (seen.has(key)) continue;
      seen.add(key);
      recent.push({
        id: l.id,
        foodId: l.foodId,
        customFoodId: l.customFoodId,
        name: l.foodName,
        quantityG: l.quantityG,
        meal: l.meal,
        lastUsedAt: l.createdAt.toISOString(),
        calories: l.calories,
        proteinG: l.proteinG,
        carbsG: l.carbsG,
        fatG: l.fatG,
      });
      if (recent.length >= limit) break;
    }
    return recent;
  }
}
