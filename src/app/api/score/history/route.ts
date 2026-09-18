import { NextRequest } from "next/server";
import { NutritionScoreService } from "@/lib/services/nutrition-score-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const days = z.coerce.number().int().min(1).max(90).catch(14).parse(
    req.nextUrl.searchParams.get("days") ?? 14,
  );
  try {
    const history = await NutritionScoreService.getHistory(user.id, days);
    return ok(history);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
