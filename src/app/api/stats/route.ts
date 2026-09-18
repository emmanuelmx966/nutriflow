import { NextRequest } from "next/server";
import { StatsService } from "@/lib/services/stats-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail } from "@/lib/api/response";
import { todayLocalString } from "@/lib/utils/date";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const date = req.nextUrl.searchParams.get("date") ?? todayLocalString();
  const parsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date);
  if (!parsed.success) return fail("Use YYYY-MM-DD", 400);
  const data = await StatsService.getDashboard(user.id, date);
  return ok(data);
}
