import { db } from "@/lib/db";
import { customFoodSchema, foodSearchSchema } from "@/lib/validators";
import type { z } from "zod";

/**
 * FoodService — read access to the curated food DB + user custom foods.
 * Single Responsibility: food catalog operations.
 */
export class FoodService {
  static async search(userId: string, input: unknown) {
    const { query, limit, category } = foodSearchSchema.parse(input);

    const where = {
      OR: [
        { name: { contains: query } },
        { brand: { contains: query } },
        { barcode: { contains: query } },
      ],
      ...(category ? { category } : {}),
    };

    const [foods, custom] = await Promise.all([
      db.food.findMany({
        where,
        take: limit,
        orderBy: { name: "asc" },
      }),
      db.customFood.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query } },
            { brand: { contains: query } },
            { barcode: { contains: query } },
          ],
        },
        take: limit,
        orderBy: { name: "asc" },
      }),
    ]);

    return { foods, custom };
  }

  static async getByBarcode(userId: string, barcode: string) {
    const food = await db.food.findUnique({ where: { barcode } });
    if (food) return { type: "food" as const, food };
    const custom = await db.customFood.findFirst({
      where: { userId, barcode },
    });
    if (custom) return { type: "custom" as const, food: custom };
    return null;
  }

  static async categories() {
    const rows = await db.food.findMany({
      where: {},
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return rows.map((r) => r.category);
  }

  static async createCustomFood(userId: string, input: unknown) {
    const data = customFoodSchema.parse(input);
    return db.customFood.create({
      data: { ...data, userId },
    });
  }

  static async listCustomFoods(userId: string) {
    return db.customFood.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  }

  static async deleteCustomFood(userId: string, id: string) {
    const owned = await db.customFood.findFirst({ where: { id, userId } });
    if (!owned) return null;
    await db.customFood.delete({ where: { id } });
    return true;
  }
}

export type CustomFoodInput = z.infer<typeof customFoodSchema>;
