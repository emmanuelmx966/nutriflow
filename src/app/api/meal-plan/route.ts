import { NextRequest } from "next/server";
import { MealPlanService } from "@/lib/services/meal-plan-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail, notFound, serverError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const weekStart = req.nextUrl.searchParams.get("week") ?? MealPlanService.getWeekStart(new Date()).toISOString().slice(0, 10);
  try {
    const entries = await MealPlanService.getWeek(user.id, weekStart);
    return ok(entries);
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
  // Check for auto-plan action
  if (body && typeof body === "object" && "action" in body && (body as { action: string }).action === "auto-plan") {
    const week = (body as { week?: string }).week ?? MealPlanService.getWeekStart(new Date()).toISOString().slice(0, 10);
    try {
      const count = await MealPlanService.autoPlanWeek(user.id, week);
      return ok({ autoPlanned: count });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      if (msg === "NO_RECIPES") return fail("Create some recipes first, then auto-plan", 400, "NO_RECIPES");
      return serverError(msg);
    }
  }
  // Check for clear action
  if (body && typeof body === "object" && "action" in body && (body as { action: string }).action === "clear") {
    const week = (body as { week?: string }).week ?? MealPlanService.getWeekStart(new Date()).toISOString().slice(0, 10);
    try {
      const count = await MealPlanService.clearWeek(user.id, week);
      return ok({ cleared: count });
    } catch (e) {
      return serverError(e instanceof Error ? e.message : "Failed");
    }
  }
  // Otherwise: upsert a slot
  try {
    const entry = await MealPlanService.upsertSlot(user.id, body);
    return ok(entry, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "RECIPE_NOT_FOUND") return notFound("Recipe not found");
    if (msg.includes("Expected") || msg.includes("required")) {
      return fail("Invalid input", 422, "VALIDATION_ERROR", msg);
    }
    return fail(msg, 400);
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const slotId = req.nextUrl.searchParams.get("id");
  if (!slotId) return fail("Missing id param", 400);
  const deleted = await MealPlanService.deleteSlot(user.id, slotId);
  return deleted ? ok({ deleted: true }) : notFound();
}
