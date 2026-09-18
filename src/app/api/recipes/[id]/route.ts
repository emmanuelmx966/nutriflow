import { NextRequest } from "next/server";
import { RecipeService } from "@/lib/services/recipe-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound, fail } from "@/lib/api/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const recipe = await RecipeService.get(user.id, id);
  return recipe ? ok(recipe) : notFound("Recipe not found");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400, "BAD_BODY");
  }
  try {
    const recipe = await RecipeService.update(user.id, id, body);
    return recipe ? ok(recipe) : notFound("Recipe not found");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Expected") || msg.includes("required")) {
      return fail("Invalid input", 422, "VALIDATION_ERROR", msg);
    }
    return fail(msg, 400);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const deleted = await RecipeService.delete(user.id, id);
  return deleted ? ok({ deleted: true }) : notFound();
}
