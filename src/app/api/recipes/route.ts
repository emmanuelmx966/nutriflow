import { NextRequest } from "next/server";
import { RecipeService } from "@/lib/services/recipe-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail, serverError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const scope = req.nextUrl.searchParams.get("scope") ?? "mine";
  try {
    if (scope === "public") {
      const recipes = await RecipeService.listPublic(50);
      return ok(recipes);
    }
    const recipes = await RecipeService.listForUser(user.id);
    return ok(recipes);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400, "BAD_BODY");
  }
  try {
    const recipe = await RecipeService.create(user.id, body);
    return ok(recipe, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Expected") || msg.includes("required")) {
      return fail("Invalid input", 422, "VALIDATION_ERROR", msg);
    }
    return fail(msg, 400);
  }
}
