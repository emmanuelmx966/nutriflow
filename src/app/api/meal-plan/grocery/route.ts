import { NextRequest } from "next/server";
import { MealPlanService } from "@/lib/services/meal-plan-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const weekStart =
    req.nextUrl.searchParams.get("week") ??
    MealPlanService.getWeekStart(new Date()).toISOString().slice(0, 10);
  try {
    const groceryList = await MealPlanService.generateGroceryList(user.id, weekStart);
    return ok(groceryList);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
