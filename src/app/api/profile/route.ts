import { NextRequest } from "next/server";
import { ProfileService } from "@/lib/services/profile-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, parseBody, fail } from "@/lib/api/response";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const profile = await ProfileService.get(user.id);
  return ok(profile);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { data, error } = await parseBody(req, profileSchema);
  if (error) return error;
  try {
    const updated = await ProfileService.update(user.id, data);
    return ok(updated);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed", 400);
  }
}
