import { db } from "@/lib/db";
import { z } from "zod";

/**
 * RecipeCommentService — recipe comments (social engagement).
 * Single Responsibility: comment CRUD on recipes.
 */

export interface RecipeCommentDTO {
  id: string;
  recipeId: string;
  content: string;
  createdAt: string;
  authorName: string | null;
  isOwn: boolean;
}

const createCommentSchema = z.object({
  recipeId: z.string().cuid(),
  content: z.string().trim().min(1, "Comment cannot be empty").max(500, "Comment too long (max 500 chars)"),
});

export class RecipeCommentService {
  static async list(userId: string, recipeId: string): Promise<RecipeCommentDTO[]> {
    const comments = await db.recipeComment.findMany({
      where: { recipeId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return comments.map((c) => ({
      id: c.id,
      recipeId: c.recipeId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      authorName: c.user?.name ?? null,
      isOwn: c.userId === userId,
    }));
  }

  static async create(userId: string, input: unknown): Promise<RecipeCommentDTO> {
    const data = createCommentSchema.parse(input);
    // Verify recipe exists + is public (or owned by user)
    const recipe = await db.recipe.findUnique({ where: { id: data.recipeId } });
    if (!recipe) throw new Error("RECIPE_NOT_FOUND");
    if (!recipe.isPublic && recipe.userId !== userId) {
      throw new Error("RECIPE_NOT_PUBLIC");
    }

    const comment = await db.recipeComment.create({
      data: { userId, recipeId: data.recipeId, content: data.content },
      include: { user: { select: { name: true } } },
    });

    return {
      id: comment.id,
      recipeId: comment.recipeId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      authorName: comment.user?.name ?? null,
      isOwn: true,
    };
  }

  static async delete(userId: string, commentId: string): Promise<boolean> {
    const comment = await db.recipeComment.findFirst({
      where: { id: commentId, userId },
    });
    if (!comment) return false;
    await db.recipeComment.delete({ where: { id: commentId } });
    return true;
  }

  static async countForRecipe(recipeId: string): Promise<number> {
    return db.recipeComment.count({ where: { recipeId } });
  }
}
