import { NextRequest } from "next/server";
import { ExerciseService } from "@/lib/services/exercise-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound, fail, parseBody } from "@/lib/api/response";
import { exerciseLogUpdateSchema } from "@/lib/validators";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const { data, error } = await parseBody(req, exerciseLogUpdateSchema);
  if (error) return error;
  try {
    const log = await ExerciseService.updateLog(user.id, id, data);
    return ok(log);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "LOG_NOT_FOUND") return notFound();
    return fail(msg, 400);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const deleted = await ExerciseService.deleteLog(user.id, id);
  return deleted ? ok({ deleted: true }) : notFound();
}
