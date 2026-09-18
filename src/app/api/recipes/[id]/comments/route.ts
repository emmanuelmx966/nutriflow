import { NextRequest } from "next/server";
import { RecipeCommentService } from "@/lib/services/recipe-comment-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail, serverError } from "@/lib/api/response";

/**
 * GET /api/recipes/[id]/comments — list comments for a recipe
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const comments = await RecipeCommentService.list(user.id, id);
    return ok(comments);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}

/**
 * POST /api/recipes/[id]/comments — add a comment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id: recipeId } = await params;
  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400, "BAD_BODY");
  }
  try {
    const comment = await RecipeCommentService.create(user.id, { recipeId, content: body.content });
    return ok(comment, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "RECIPE_NOT_FOUND") return fail("Recipe not found", 404, "NOT_FOUND");
    if (msg === "RECIPE_NOT_PUBLIC") return fail("You can only comment on public recipes", 403, "FORBIDDEN");
    if (msg.includes("Expected") || msg.includes("required")) {
      return fail("Invalid input", 422, "VALIDATION_ERROR", msg);
    }
    return serverError(msg);
  }
}
