import { db } from "@/lib/db";

/**
 * RecipeLikeService — recipe likes (social/community feature).
 * Single Responsibility: like/unlike + community recipe browsing.
 */

export interface CommunityRecipe {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  likeCount: number;
  avgRating: number;
  ratingCount: number;
  userRating: number | null;
  authorName: string | null;
  liked: boolean;
  createdAt: string;
}

export class RecipeLikeService {
  /**
   * Toggle like on a recipe (creates or removes).
   */
  static async toggle(userId: string, recipeId: string): Promise<{ liked: boolean; likeCount: number }> {
    const recipe = await db.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new Error("RECIPE_NOT_FOUND");

    const existing = await db.recipeLike.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
    });

    if (existing) {
      await db.recipeLike.delete({ where: { id: existing.id } });
      const updated = await db.recipe.update({
        where: { id: recipeId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
      return { liked: false, likeCount: Math.max(0, updated.likeCount) };
    }

    await db.recipeLike.create({ data: { userId, recipeId } });
    const updated = await db.recipe.update({
      where: { id: recipeId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
    return { liked: true, likeCount: updated.likeCount };
  }

  /**
   * List community (public) recipes with like counts + author info.
   */
  static async listCommunity(
    userId: string,
    limit = 20,
    sort: "popular" | "recent" | "rated" = "popular",
  ): Promise<CommunityRecipe[]> {
    const recipes = await db.recipe.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { name: true } },
        likes: { where: { userId }, select: { id: true } },
        ratings: { where: { userId }, select: { rating: true } },
      },
      orderBy:
        sort === "popular"
          ? { likeCount: "desc" }
          : sort === "rated"
            ? { avgRating: "desc" }
            : { createdAt: "desc" },
      take: limit,
    });

    return recipes.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      servings: r.servings,
      calories: r.calories,
      proteinG: r.proteinG,
      carbsG: r.carbsG,
      fatG: r.fatG,
      likeCount: r.likeCount,
      avgRating: r.avgRating,
      ratingCount: r.ratingCount,
      userRating: r.ratings[0]?.rating ?? null,
      authorName: r.user?.name ?? null,
      liked: r.likes.length > 0,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Get liked status for a single recipe.
   */
  static async isLiked(userId: string, recipeId: string): Promise<boolean> {
    const like = await db.recipeLike.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
    });
    return !!like;
  }
}
