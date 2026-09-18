import { db } from "@/lib/db";

/**
 * RecommendationsService — macro-based recipe suggestions.
 * Single Responsibility: suggest recipes that fill remaining macro gaps.
 */

export interface RecipeRecommendation {
  recipe: {
    id: string;
    name: string;
    description: string | null;
    servings: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  reason: string;
  matchScore: number; // 0-100
}

export class RecommendationsService {
  /**
   * Suggest recipes that best fill the user's remaining macro gap today.
   * Prioritizes protein deficit (most common goal).
   */
  static async suggestForRemaining(
    userId: string,
    remaining: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
    limit = 5,
  ): Promise<RecipeRecommendation[]> {
    const recipes = await db.recipe.findMany({
      where: { userId },
      take: 50,
      orderBy: { updatedAt: "desc" },
    });

    if (recipes.length === 0) return [];

    const scored = recipes.map((r) => {
      let score = 0;
      const reasons: string[] = [];

      // Protein match (highest weight)
      if (remaining.protein > 0) {
        const proteinFit = Math.min(1, r.proteinG / remaining.protein);
        score += proteinFit * 40;
        if (proteinFit > 0.7) reasons.push("high protein");
      }

      // Calorie fit (don't exceed remaining)
      if (remaining.calories > 0) {
        const calFit = r.calories <= remaining.calories
          ? 1
          : Math.max(0, 1 - (r.calories - remaining.calories) / remaining.calories);
        score += calFit * 30;
        if (r.calories <= remaining.calories) reasons.push("fits calories");
      }

      // Carb fit
      if (remaining.carbs > 0) {
        const carbFit = Math.min(1, r.carbsG / remaining.carbs);
        score += carbFit * 15;
      }

      // Fat fit
      if (remaining.fat > 0) {
        const fatFit = Math.min(1, r.fatG / remaining.fat);
        score += fatFit * 15;
      }

      return {
        recipe: {
          id: r.id,
          name: r.name,
          description: r.description,
          servings: r.servings,
          calories: r.calories,
          proteinG: r.proteinG,
          carbsG: r.carbsG,
          fatG: r.fatG,
        },
        reason: reasons.length > 0 ? reasons.join(", ") : "balanced",
        matchScore: Math.round(score),
      };
    });

    return scored
      .filter((s) => s.matchScore > 20)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Suggest foods (from catalog) that match remaining macros.
   * Enhanced: targets the largest macro deficit with smart portion sizing.
   */
  static async suggestFoodsForRemaining(
    userId: string,
    remaining: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    },
    limit = 5,
  ): Promise<Array<{
    id: string;
    name: string;
    category: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    defaultServingG: number;
    suggestedPortionG: number;
    suggestedCalories: number;
    suggestedProtein: number;
    reason: string;
    targetMacro: "protein" | "carbs" | "fat" | "calories";
  }>> {
    // Determine the primary macro deficit
    const deficits: Array<{ macro: "protein" | "carbs" | "fat" | "calories"; value: number }> = [
      { macro: "protein", value: remaining.protein },
      { macro: "carbs", value: remaining.carbs },
      { macro: "fat", value: remaining.fat },
    ];
    deficits.sort((a, b) => b.value - a.value);

    const primary = deficits[0];
    if (primary.value <= 0 && remaining.calories <= 0) return [];

    // Query foods high in the deficit macro
    let where = {};
    let orderBy = {};
    if (primary.macro === "protein" && remaining.protein > 5) {
      where = { proteinPer100g: { gte: 15 } };
      orderBy = { proteinPer100g: "desc" };
    } else if (primary.macro === "carbs" && remaining.carbs > 10) {
      where = { carbsPer100g: { gte: 20 } };
      orderBy = { carbsPer100g: "desc" };
    } else if (primary.macro === "fat" && remaining.fat > 3) {
      where = { fatPer100g: { gte: 10 } };
      orderBy = { fatPer100g: "desc" };
    } else {
      // Fallback: low-calorie foods that fit remaining budget
      where = { caloriesPer100g: { lte: Math.max(100, remaining.calories / 2) } };
      orderBy = { caloriesPer100g: "asc" };
    }

    const foods = await db.food.findMany({
      where,
      orderBy,
      take: 30,
    });

    // Score each food by how well it fills the deficit
    return foods
      .map((f) => {
        // Calculate suggested portion to fill the deficit
        let targetMacroPer100g = 0;
        let remainingDeficit = 0;
        let targetMacro: "protein" | "carbs" | "fat" | "calories" = "calories";

        if (primary.macro === "protein" && remaining.protein > 0) {
          targetMacroPer100g = f.proteinPer100g;
          remainingDeficit = remaining.protein;
          targetMacro = "protein";
        } else if (primary.macro === "carbs" && remaining.carbs > 0) {
          targetMacroPer100g = f.carbsPer100g;
          remainingDeficit = remaining.carbs;
          targetMacro = "carbs";
        } else if (primary.macro === "fat" && remaining.fat > 0) {
          targetMacroPer100g = f.fatPer100g;
          remainingDeficit = remaining.fat;
          targetMacro = "fat";
        }

        // Suggested portion: enough to fill the deficit, capped at reasonable serving
        const suggestedPortionG = targetMacroPer100g > 0
          ? Math.min(500, Math.max(50, Math.round((remainingDeficit / targetMacroPer100g) * 100)))
          : f.defaultServingG;

        const factor = suggestedPortionG / 100;
        const suggestedCalories = Math.round(f.caloriesPer100g * factor);
        const suggestedProtein = Math.round(f.proteinPer100g * factor * 10) / 10;

        // Don't suggest if it blows the calorie budget
        if (remaining.calories > 0 && suggestedCalories > remaining.calories * 1.3) {
          return null;
        }

        const reason = `${Math.round(targetMacroPer100g)}g ${targetMacro}/100g · ${suggestedPortionG}g fills ${Math.round((remainingDeficit > 0 ? Math.min(100, (suggestedProtein || suggestedCalories) / remainingDeficit * 100) : 0))}% gap`;

        return {
          id: f.id,
          name: f.name,
          category: f.category,
          caloriesPer100g: f.caloriesPer100g,
          proteinPer100g: f.proteinPer100g,
          carbsPer100g: f.carbsPer100g,
          fatPer100g: f.fatPer100g,
          defaultServingG: f.defaultServingG,
          suggestedPortionG,
          suggestedCalories,
          suggestedProtein,
          reason,
          targetMacro,
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .slice(0, limit);
  }
}