import { NextRequest } from "next/server";
import { InsightsService } from "@/lib/services/insights-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const insights = await InsightsService.getInsights(user.id);
    return ok(insights);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
