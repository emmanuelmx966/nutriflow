import { NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth-service";
import { fail, ok, rateLimited, getClientIp } from "@/lib/api/response";
import { authRateLimiter } from "@/lib/security/rate-limit";
import { registerSchema } from "@/lib/validators";
import { db } from "@/lib/db";

/**
 * POST /api/auth/register
 * Secure registration with rate limiting, validation, bcrypt hashing.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = authRateLimiter.check(`register:${ip}`);
  if (!limit.success) return rateLimited(limit.resetAt);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("Invalid JSON body", 400, "BAD_BODY");
  }

  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return fail("Invalid input", 422, "VALIDATION_ERROR", parsed.error.issues);
  }

  // Check email uniqueness explicitly for friendlier errors
  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return fail("An account with that email already exists", 409, "EMAIL_TAKEN");
  }

  try {
    const user = await AuthService.register(parsed.data);
    authRateLimiter.reset(`register:${ip}`);
    return ok({ user, message: "Account created. Please sign in." }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Registration failed";
    return fail(msg, 400, "REGISTER_FAILED");
  }
}
