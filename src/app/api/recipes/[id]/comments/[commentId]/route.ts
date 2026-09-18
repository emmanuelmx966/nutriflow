import { NextRequest } from "next/server";
import { RecipeCommentService } from "@/lib/services/recipe-comment-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound } from "@/lib/api/response";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { commentId } = await params;
  const deleted = await RecipeCommentService.delete(user.id, commentId);
  return deleted ? ok({ deleted: true }) : notFound("Comment not found");
}
