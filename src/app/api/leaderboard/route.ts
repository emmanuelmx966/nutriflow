import { NextRequest } from "next/server";
import { LeaderboardService } from "@/lib/services/leaderboard-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const data = await LeaderboardService.getLeaderboard(user.id, 10);
    return ok(data);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
