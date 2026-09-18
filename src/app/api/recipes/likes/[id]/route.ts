import { NextRequest } from "next/server";
import { RecipeLikeService } from "@/lib/services/recipe-like-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";

/**
 * GET /api/recipes/likes/[id] — check if user liked a specific recipe
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const liked = await RecipeLikeService.isLiked(user.id, id);
    return ok({ liked });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
