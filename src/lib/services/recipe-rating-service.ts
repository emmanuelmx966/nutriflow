import { db } from "@/lib/db";

/**
 * RecipeRatingService — 1-5 star ratings for recipes (social feature).
 * Single Responsibility: rate/unrate + average rating computation.
 */

export interface RatingInfo {
  userRating: number | null;
  avgRating: number;
  ratingCount: number;
}

export class RecipeRatingService {
  /**
   * Set or update the user's rating for a recipe.
   */
  static async rate(userId: string, recipeId: string, rating: number): Promise<RatingInfo> {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error("INVALID_RATING");
    }
    const recipe = await db.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new Error("RECIPE_NOT_FOUND");

    const existing = await db.recipeRating.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
    });

    if (existing) {
      await db.recipeRating.update({
        where: { id: existing.id },
        data: { rating },
      });
    } else {
      await db.recipeRating.create({
        data: { userId, recipeId, rating },
      });
    }

    // Recalculate average
    const stats = await this.recomputeStats(recipeId);
    return {
      userRating: rating,
      avgRating: stats.avgRating,
      ratingCount: stats.ratingCount,
    };
  }

  /**
   * Remove the user's rating.
   */
  static async unrate(userId: string, recipeId: string): Promise<RatingInfo> {
    const existing = await db.recipeRating.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
    });
    if (existing) {
      await db.recipeRating.delete({ where: { id: existing.id } });
    }
    const stats = await this.recomputeStats(recipeId);
    return {
      userRating: null,
      avgRating: stats.avgRating,
      ratingCount: stats.ratingCount,
    };
  }

  /**
   * Get rating info for a recipe (user's rating + average).
   */
  static async getInfo(userId: string, recipeId: string): Promise<RatingInfo> {
    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      select: { avgRating: true, ratingCount: true },
    });
    if (!recipe) throw new Error("RECIPE_NOT_FOUND");

    const userRating = await db.recipeRating.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
      select: { rating: true },
    });

    return {
      userRating: userRating?.rating ?? null,
      avgRating: recipe.avgRating,
      ratingCount: recipe.ratingCount,
    };
  }

  /**
   * Recompute + persist avgRating + ratingCount on the recipe.
   */
  private static async recomputeStats(recipeId: string): Promise<{ avgRating: number; ratingCount: number }> {
    const ratings = await db.recipeRating.findMany({
      where: { recipeId },
      select: { rating: true },
    });
    const count = ratings.length;
    const avg = count > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / count : 0;
    await db.recipe.update({
      where: { id: recipeId },
      data: {
        avgRating: Math.round(avg * 10) / 10,
        ratingCount: count,
      },
    });
    return { avgRating: Math.round(avg * 10) / 10, ratingCount: count };
  }
}
