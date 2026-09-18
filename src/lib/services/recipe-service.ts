import { db } from "@/lib/db";
import { z } from "zod";

/**
 * RecipeService — custom meal/recipe builder (MyFitnessPal feature).
 * Single Responsibility: recipe CRUD + ingredient aggregation.
 */

export const recipeCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  servings: z.number().int().min(1).max(50).default(1),
  ingredients: z
    .array(
      z.object({
        foodId: z.string().cuid().optional(),
        name: z.string().trim().min(1).max(120),
        quantityG: z.number().min(1).max(5000),
      }),
    )
    .min(1, "Add at least one ingredient")
    .max(30, "Maximum 30 ingredients per recipe"),
});

export type RecipeCreateInput = z.infer<typeof recipeCreateSchema>;

export interface RecipeWithIngredients {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isPublic: boolean;
  likeCount: number;
  createdAt: string;
  ingredients: Array<{
    id: string;
    name: string;
    quantityG: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>;
}

export class RecipeService {
  static async listForUser(userId: string): Promise<RecipeWithIngredients[]> {
    const recipes = await db.recipe.findMany({
      where: { userId },
      include: { ingredients: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return recipes.map(toRecipeDTO);
  }

  static async listPublic(limit = 50): Promise<RecipeWithIngredients[]> {
    const recipes = await db.recipe.findMany({
      where: { isPublic: true },
      include: { ingredients: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return recipes.map(toRecipeDTO);
  }

  static async get(userId: string, id: string): Promise<RecipeWithIngredients | null> {
    const recipe = await db.recipe.findFirst({
      where: { id, userId },
      include: { ingredients: true },
    });
    return recipe ? toRecipeDTO(recipe) : null;
  }

  static async create(userId: string, input: unknown): Promise<RecipeWithIngredients> {
    const data = recipeCreateSchema.parse(input);

    // Resolve ingredient nutrition (from Food table or manual entry)
    const resolvedIngredients = await Promise.all(
      data.ingredients.map(async (ing) => {
        let per100 = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        if (ing.foodId) {
          const food = await db.food.findUnique({ where: { id: ing.foodId } });
          if (food) {
            per100 = {
              calories: food.caloriesPer100g,
              protein: food.proteinPer100g,
              carbs: food.carbsPer100g,
              fat: food.fatPer100g,
            };
          }
        }
        const factor = ing.quantityG / 100;
        return {
          name: ing.name,
          foodId: ing.foodId ?? null,
          quantityG: ing.quantityG,
          calories: Math.round(per100.calories * factor),
          proteinG: Math.round(per100.protein * factor * 10) / 10,
          carbsG: Math.round(per100.carbs * factor * 10) / 10,
          fatG: Math.round(per100.fat * factor * 10) / 10,
        };
      }),
    );

    const totals = resolvedIngredients.reduce(
      (acc, ing) => {
        acc.calories += ing.calories;
        acc.protein += ing.proteinG;
        acc.carbs += ing.carbsG;
        acc.fat += ing.fatG;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const perServing = {
      calories: Math.round(totals.calories / data.servings),
      proteinG: Math.round((totals.protein / data.servings) * 10) / 10,
      carbsG: Math.round((totals.carbs / data.servings) * 10) / 10,
      fatG: Math.round((totals.fat / data.servings) * 10) / 10,
    };

    const recipe = await db.recipe.create({
      data: {
        userId,
        name: data.name,
        description: data.description ?? null,
        servings: data.servings,
        ...perServing,
        ingredients: {
          create: resolvedIngredients,
        },
      },
      include: { ingredients: true },
    });

    return toRecipeDTO(recipe);
  }

  static async update(
    userId: string,
    id: string,
    input: unknown,
  ): Promise<RecipeWithIngredients | null> {
    const data = recipeCreateSchema.parse(input);
    const existing = await db.recipe.findFirst({ where: { id, userId } });
    if (!existing) return null;

    // Resolve ingredients
    const resolvedIngredients = await Promise.all(
      data.ingredients.map(async (ing) => {
        let per100 = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        if (ing.foodId) {
          const food = await db.food.findUnique({ where: { id: ing.foodId } });
          if (food) {
            per100 = {
              calories: food.caloriesPer100g,
              protein: food.proteinPer100g,
              carbs: food.carbsPer100g,
              fat: food.fatPer100g,
            };
          }
        }
        const factor = ing.quantityG / 100;
        return {
          name: ing.name,
          foodId: ing.foodId ?? null,
          quantityG: ing.quantityG,
          calories: Math.round(per100.calories * factor),
          proteinG: Math.round(per100.protein * factor * 10) / 10,
          carbsG: Math.round(per100.carbs * factor * 10) / 10,
          fatG: Math.round(per100.fat * factor * 10) / 10,
        };
      }),
    );

    const totals = resolvedIngredients.reduce(
      (acc, ing) => {
        acc.calories += ing.calories;
        acc.protein += ing.proteinG;
        acc.carbs += ing.carbsG;
        acc.fat += ing.fatG;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const perServing = {
      calories: Math.round(totals.calories / data.servings),
      proteinG: Math.round((totals.protein / data.servings) * 10) / 10,
      carbsG: Math.round((totals.carbs / data.servings) * 10) / 10,
      fatG: Math.round((totals.fat / data.servings) * 10) / 10,
    };

    // Replace ingredients (delete old, create new within transaction)
    await db.recipeIngredient.deleteMany({ where: { recipeId: id } });
    const recipe = await db.recipe.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
        servings: data.servings,
        ...perServing,
        ingredients: { create: resolvedIngredients },
      },
      include: { ingredients: true },
    });
    return toRecipeDTO(recipe);
  }

  static async delete(userId: string, id: string): Promise<boolean> {
    const existing = await db.recipe.findFirst({ where: { id, userId } });
    if (!existing) return false;
    await db.recipe.delete({ where: { id } });
    return true;
  }

  static async togglePublic(userId: string, id: string): Promise<RecipeWithIngredients | null> {
    const existing = await db.recipe.findFirst({ where: { id, userId } });
    if (!existing) return null;
    const recipe = await db.recipe.update({
      where: { id },
      data: { isPublic: !existing.isPublic },
      include: { ingredients: true },
    });
    return toRecipeDTO(recipe);
  }

  /**
   * Log a recipe as a single diary entry for a meal.
   */
  static async logToDiary(
    userId: string,
    recipeId: string,
    meal: string,
    dateStr: string,
    servings: number,
  ) {
    const recipe = await db.recipe.findFirst({
      where: { id: recipeId, userId },
      include: { ingredients: true },
    });
    if (!recipe) throw new Error("RECIPE_NOT_FOUND");

    const factor = servings;
    return db.foodLog.create({
      data: {
        userId,
        date: new Date(dateStr + "T12:00:00"),
        meal,
        foodId: null,
        customFoodId: null,
        foodName: `${recipe.name} (recipe)`,
        quantityG: servings * recipe.servings * 100,
        servings,
        calories: Math.round(recipe.calories * factor),
        proteinG: Math.round(recipe.proteinG * factor * 10) / 10,
        carbsG: Math.round(recipe.carbsG * factor * 10) / 10,
        fatG: Math.round(recipe.fatG * factor * 10) / 10,
        fiberG: null,
      },
    });
  }
}

function toRecipeDTO(recipe: {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isPublic: boolean;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  ingredients: Array<{
    id: string;
    name: string;
    quantityG: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>;
}): RecipeWithIngredients {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    servings: recipe.servings,
    calories: recipe.calories,
    proteinG: recipe.proteinG,
    carbsG: recipe.carbsG,
    fatG: recipe.fatG,
    isPublic: recipe.isPublic,
    likeCount: recipe.likeCount,
    createdAt: recipe.createdAt.toISOString(),
    ingredients: recipe.ingredients.map((i) => ({
      id: i.id,
      name: i.name,
      quantityG: i.quantityG,
      calories: i.calories,
      proteinG: i.proteinG,
      carbsG: i.carbsG,
      fatG: i.fatG,
    })),
  };
}
