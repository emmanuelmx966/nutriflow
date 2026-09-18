import { NextRequest } from "next/server";
import { RecipeService } from "@/lib/services/recipe-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound, fail, serverError } from "@/lib/api/response";
import { z } from "zod";

const logSchema = z.object({
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  servings: z.number().min(0.25).max(20).default(1),
});

export async function POST(
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
    return fail("Invalid JSON", 400);
  }
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid input", 422, "VALIDATION_ERROR", parsed.error.issues);
  }
  try {
    const log = await RecipeService.logToDiary(user.id, id, parsed.data.meal, parsed.data.date, parsed.data.servings);
    return ok(log, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "RECIPE_NOT_FOUND") return notFound("Recipe not found");
    return serverError(msg);
  }
}
