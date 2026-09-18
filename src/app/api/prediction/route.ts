import { NextRequest } from "next/server";
import { GoalPredictionService } from "@/lib/services/goal-prediction-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const prediction = await GoalPredictionService.predict(user.id);
    return ok(prediction);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
