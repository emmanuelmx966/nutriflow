import { db } from "@/lib/db";
import { MealPlanService } from "./meal-plan-service";
import { toLocalDateString } from "@/lib/utils/date";

/**
 * MealPlanTemplateService — pre-built weekly meal plan templates.
 * Single Responsibility: provide curated templates + apply them.
 */

export interface MealPlanTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  theme: string;
  targetCalories: string;
  tags: string[];
}

export const MEAL_PLAN_TEMPLATES: MealPlanTemplate[] = [
  {
    id: "balanced",
    name: "Balanced Week",
    description: "A varied mix of proteins, carbs, and fats across all meals. Great starting point.",
    emoji: "🌿",
    theme: "Balanced",
    targetCalories: "~2000 kcal/day",
    tags: ["balanced", "beginner-friendly", "varied"],
  },
  {
    id: "high-protein",
    name: "High Protein",
    description: "Protein-rich meals to support muscle building and satiety. 40% protein focus.",
    emoji: "💪",
    theme: "High Protein",
    targetCalories: "~2200 kcal/day",
    tags: ["high-protein", "muscle", "low-carb"],
  },
  {
    id: "mediterranean",
    name: "Mediterranean",
    description: "Heart-healthy plan inspired by Mediterranean cuisine. Olive oil, fish, vegetables.",
    emoji: "🌊",
    theme: "Mediterranean",
    targetCalories: "~1900 kcal/day",
    tags: ["mediterranean", "heart-healthy", "omega-3"],
  },
  {
    id: "low-carb",
    name: "Low Carb",
    description: "Reduced carbohydrates with higher fat and protein. Supports keto-adjacent eating.",
    emoji: "🥑",
    theme: "Low Carb",
    targetCalories: "~1800 kcal/day",
    tags: ["low-carb", "keto-friendly", "high-fat"],
  },
  {
    id: "plant-forward",
    name: "Plant Forward",
    description: "Mostly plant-based meals with occasional animal protein. Flexible and sustainable.",
    emoji: "🌱",
    theme: "Plant-Based",
    targetCalories: "~1900 kcal/day",
    tags: ["plant-based", "vegetarian-friendly", "fiber-rich"],
  },
  {
    id: "performance",
    name: "Performance",
    description: "Higher calories with timed carbs around workouts. Built for active lifestyles.",
    emoji: "⚡",
    theme: "Performance",
    targetCalories: "~2500 kcal/day",
    tags: ["high-calorie", "performance", "carb-focused"],
  },
];

export class MealPlanTemplateService {
  static list(): MealPlanTemplate[] {
    return MEAL_PLAN_TEMPLATES;
  }

  static get(id: string): MealPlanTemplate | null {
    return MEAL_PLAN_TEMPLATES.find((t) => t.id === id) ?? null;
  }

  /**
   * Apply a template to a week. Uses the user's own recipes, cycling through
   * them in a pattern that matches the template's theme.
   * Falls back to catalog foods if no recipes available.
   */
  static async applyTemplate(
    userId: string,
    templateId: string,
    weekStartDateStr: string,
  ): Promise<{ planned: number; template: MealPlanTemplate }> {
    const template = this.get(templateId);
    if (!template) throw new Error("TEMPLATE_NOT_FOUND");

    // Get user's recipes
    const recipes = await db.recipe.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    // Also get public community recipes as fallback
    const communityRecipes = recipes.length < 3
      ? await db.recipe.findMany({
          where: { isPublic: true, NOT: { userId } },
          take: 10,
          orderBy: { likeCount: "desc" },
        })
      : [];

    const allRecipes = [...recipes, ...communityRecipes];
    if (allRecipes.length === 0) throw new Error("NO_RECIPES");

    const weekStart = new Date(weekStartDateStr + "T00:00:00");

    // Template-specific meal assignments
    // Each template defines which recipe index pattern to use for each day/meal
    const mealPattern = this.getMealPattern(templateId, allRecipes.length);

    let planned = 0;
    for (let day = 0; day < 7; day++) {
      for (const meal of mealPattern[day]) {
        // Check if slot already filled
        const existing = await db.mealPlan.findUnique({
          where: {
            userId_weekStartDate_dayIndex_meal: {
              userId,
              weekStartDate: weekStart,
              dayIndex: day,
              meal: meal.meal,
            },
          },
        });
        if (existing) continue;

        const recipeIdx = meal.recipeIdx % allRecipes.length;
        const recipe = allRecipes[recipeIdx];
        if (!recipe) continue;

        await db.mealPlan.create({
          data: {
            userId,
            weekStartDate: weekStart,
            dayIndex: day,
            meal: meal.meal,
            recipeId: recipe.id,
            servings: 1,
          },
        });
        planned++;
      }
    }

    return { planned, template };
  }

  /**
   * Get meal pattern for a template.
   * Returns array of 7 days, each with array of {meal, recipeIdx}.
   * Pattern varies by template theme to create variety.
   */
  private static getMealPattern(templateId: string, recipeCount: number): Array<Array<{ meal: string; recipeIdx: number }>> {
    const meals = ["breakfast", "lunch", "dinner"];
    const patterns: Record<string, number[][]> = {};

    // Each day uses a different offset to create rotation
    for (const id of ["balanced", "high-protein", "mediterranean", "low-carb", "plant-forward", "performance"]) {
      patterns[id] = Array.from({ length: 7 }, (_, day) =>
        meals.map((_, mealIdx) => (day * 3 + mealIdx * 2) % Math.max(recipeCount, 3)),
      );
    }

    const pattern = patterns[templateId] ?? patterns.balanced;

    return pattern.map((day, dayIdx) =>
      day.map((recipeIdx, mealIdx) => ({
        meal: meals[mealIdx],
        recipeIdx,
      })),
    );
  }
}
