import { NextRequest } from "next/server";
import { RecipeRatingService } from "@/lib/services/recipe-rating-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail, notFound, serverError } from "@/lib/api/response";
import { z } from "zod";

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

/**
 * GET /api/recipes/[id]/rating — get rating info (user's rating + avg)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const info = await RecipeRatingService.getInfo(user.id, id);
    return ok(info);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "RECIPE_NOT_FOUND") return notFound("Recipe not found");
    return serverError(msg);
  }
}

/**
 * POST /api/recipes/[id]/rating — set/update rating (1-5)
 * DELETE /api/recipes/[id]/rating — remove rating
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  let body: { rating?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400, "BAD_BODY");
  }
  const parsed = rateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Rating must be an integer 1-5", 422, "VALIDATION_ERROR");
  }
  try {
    const info = await RecipeRatingService.rate(user.id, id, parsed.data.rating);
    return ok(info);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "RECIPE_NOT_FOUND") return notFound("Recipe not found");
    if (msg === "INVALID_RATING") return fail("Rating must be 1-5", 422, "VALIDATION_ERROR");
    return serverError(msg);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const info = await RecipeRatingService.unrate(user.id, id);
    return ok(info);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
