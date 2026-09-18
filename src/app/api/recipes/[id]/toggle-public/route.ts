import { NextRequest } from "next/server";
import { RecipeService } from "@/lib/services/recipe-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound, serverError } from "@/lib/api/response";

/**
 * POST /api/recipes/[id]/toggle-public
 * Toggle the isPublic flag on a recipe (share to community / unshare).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const recipe = await RecipeService.togglePublic(user.id, id);
    return recipe ? ok(recipe) : notFound("Recipe not found");
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
