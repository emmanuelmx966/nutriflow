import { NextRequest } from "next/server";
import { WaterService } from "@/lib/services/water-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, parseBody, fail } from "@/lib/api/response";
import { waterLogSchema } from "@/lib/validators";
import { todayLocalString } from "@/lib/utils/date";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const date = req.nextUrl.searchParams.get("date") ?? todayLocalString();
  const parsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date);
  if (!parsed.success) return fail("Use YYYY-MM-DD", 400);
  const amount = await WaterService.getDay(user.id, date);
  return ok({ date, amountMl: amount });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { data, error } = await parseBody(req, waterLogSchema);
  if (error) return error;
  try {
    const log = await WaterService.set(user.id, data);
    return ok(log);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed", 400);
  }
}
