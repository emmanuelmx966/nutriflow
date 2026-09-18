import { NextRequest } from "next/server";
import { WeightService } from "@/lib/services/weight-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, parseBody, fail } from "@/lib/api/response";
import { weightLogSchema } from "@/lib/validators";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const daysParam = req.nextUrl.searchParams.get("days") ?? "90";
  const days = z.coerce.number().int().min(1).max(365).catch(90).parse(daysParam);
  const history = await WeightService.history(user.id, days);
  return ok(history);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { data, error } = await parseBody(req, weightLogSchema);
  if (error) return error;
  try {
    const log = await WeightService.upsert(user.id, data);
    return ok(log, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed", 400);
  }
}
