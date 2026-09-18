import { NextRequest } from "next/server";
import { GoalService } from "@/lib/services/goal-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, parseBody, fail } from "@/lib/api/response";
import { goalSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const [active, history] = await Promise.all([
    GoalService.getActive(user.id),
    GoalService.history(user.id),
  ]);
  return ok({ active, history });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { data, error } = await parseBody(req, goalSchema);
  if (error) return error;
  try {
    const goal = await GoalService.upsert(user.id, data);
    return ok(goal, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed", 400);
  }
}
