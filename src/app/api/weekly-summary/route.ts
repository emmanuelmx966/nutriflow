import { NextRequest } from "next/server";
import { WeeklySummaryService } from "@/lib/services/weekly-summary-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const summary = await WeeklySummaryService.getSummary(user.id);
    return ok(summary);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
