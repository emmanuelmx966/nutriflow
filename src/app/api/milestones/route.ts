import { NextRequest } from "next/server";
import { MilestonesService } from "@/lib/services/milestones-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const data = await MilestonesService.getMilestones(user.id);
    return ok(data);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}
