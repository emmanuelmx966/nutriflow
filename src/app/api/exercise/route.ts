import { NextRequest } from "next/server";
import { ExerciseService } from "@/lib/services/exercise-service";
import { getCurrentUserProfile } from "@/lib/auth";
import { ok, unauthorized, parseQuery, parseBody, fail } from "@/lib/api/response";
import { exerciseLogCreateSchema, exerciseSearchSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const profile = await getCurrentUserProfile();
  if (!profile) return unauthorized();
  const { data, error } = parseQuery(req.nextUrl.searchParams, exerciseSearchSchema);
  if (error) return error;
  const result = await ExerciseService.search(data);
  return ok(result);
}

export async function POST(req: NextRequest) {
  const profile = await getCurrentUserProfile();
  if (!profile) return unauthorized();
  const { data, error } = await parseBody(req, exerciseLogCreateSchema);
  if (error) return error;
  try {
    const log = await ExerciseService.addLog(
      profile.id,
      profile.weightKg ?? 70,
      data,
    );
    return ok(log, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed", 400);
  }
}
