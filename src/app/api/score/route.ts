import { NextRequest } from "next/server";
import { NutritionScoreService } from "@/lib/services/nutrition-score-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const score = await NutritionScoreService.compute(user.id);
    return ok(score);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
