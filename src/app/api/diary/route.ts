import { NextRequest } from "next/server";
import { DiaryService } from "@/lib/services/diary-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, parseBody, fail, notFound } from "@/lib/api/response";
import { foodLogCreateSchema } from "@/lib/validators";
import { todayLocalString } from "@/lib/utils/date";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const date = req.nextUrl.searchParams.get("date") ?? todayLocalString();
  const parsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(date);
  if (!parsed.success) return fail("Use YYYY-MM-DD", 400);
  const day = await DiaryService.getDay(user.id, date);
  return ok(day);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { data, error } = await parseBody(req, foodLogCreateSchema);
  if (error) return error;
  try {
    const log = await DiaryService.addLog(user.id, data);
    return ok(log, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FOOD_NOT_FOUND") return notFound("Food not found");
    return fail(msg, 400);
  }
}
