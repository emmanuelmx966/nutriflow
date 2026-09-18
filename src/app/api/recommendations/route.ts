import { NextRequest } from "next/server";
import { RecommendationsService } from "@/lib/services/recommendations-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";

/**
 * GET /api/recommendations?remainingCal=500&remainingProtein=40&remainingCarbs=60&remainingFat=15
 * Returns recipe + food suggestions that fill remaining macro gaps.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const p = req.nextUrl.searchParams;
  const remaining = {
    calories: Number(p.get("remainingCal") ?? 0),
    protein: Number(p.get("remainingProtein") ?? 0),
    carbs: Number(p.get("remainingCarbs") ?? 0),
    fat: Number(p.get("remainingFat") ?? 0),
  };
  try {
    const [recipes, foods] = await Promise.all([
      RecommendationsService.suggestForRemaining(user.id, remaining, 5),
      RecommendationsService.suggestFoodsForRemaining(user.id, remaining, 5),
    ]);
    return ok({ recipes, foods });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
