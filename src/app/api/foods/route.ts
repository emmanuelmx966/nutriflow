import { NextRequest } from "next/server";
import { FoodService } from "@/lib/services/food-service";
import { getCurrentUser, requireUserId } from "@/lib/auth";
import { ok, unauthorized, parseBody, fail, notFound } from "@/lib/api/response";
import { customFoodSchema, foodSearchSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const params = req.nextUrl.searchParams;
  const parsed = foodSearchSchema.safeParse({
    query: params.get("query") ?? "",
    limit: params.get("limit") ?? 20,
    category: params.get("category") ?? undefined,
  });
  if (!parsed.success) return fail("Invalid query", 422, "VALIDATION_ERROR", parsed.error.issues);
  const result = await FoodService.search(user.id, parsed.data);
  return ok(result);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { data, error } = await parseBody(req, customFoodSchema);
  if (error) return error;
  try {
    const food = await FoodService.createCustomFood(user.id, data);
    return ok(food, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed", 400);
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return unauthorized();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing id param", 400);
  const deleted = await FoodService.deleteCustomFood(userId, id);
  return deleted ? ok({ deleted: true }) : notFound();
}
