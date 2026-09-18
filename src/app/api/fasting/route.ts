import { NextRequest } from "next/server";
import { FastingService } from "@/lib/services/fasting-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, parseBody, fail } from "@/lib/api/response";
import { fastStartSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const [current, history] = await Promise.all([
    FastingService.current(user.id),
    FastingService.history(user.id),
  ]);
  return ok({ current, history });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { data, error } = await parseBody(req, fastStartSchema);
  if (error) return error;
  try {
    const session = await FastingService.start(user.id, data);
    return ok(session, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed", 400);
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const session = await FastingService.stop(user.id);
  if (!session) return ok({ stopped: false, message: "No active fast" });
  return ok({ stopped: true, session });
}
