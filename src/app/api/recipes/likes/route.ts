import { NextRequest } from "next/server";
import { RecipeLikeService } from "@/lib/services/recipe-like-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail, notFound, serverError } from "@/lib/api/response";

/**
 * GET /api/recipes/likes?sort=popular|recent|rated
 * List community recipes with like status + rating info.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const sort = (req.nextUrl.searchParams.get("sort") ?? "popular") as "popular" | "recent" | "rated";
  try {
    const recipes = await RecipeLikeService.listCommunity(user.id, 30, sort);
    return ok(recipes);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}

/**
 * POST /api/recipes/likes?recipeId=XXX
 * Toggle like on a recipe.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const recipeId = req.nextUrl.searchParams.get("recipeId");
  if (!recipeId) return fail("Missing recipeId param", 400);
  try {
    const result = await RecipeLikeService.toggle(user.id, recipeId);
    return ok(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "RECIPE_NOT_FOUND") return notFound("Recipe not found");
    return serverError(msg);
  }
}
