import { NextRequest } from "next/server";
import { MealVisionService } from "@/lib/ai/meal-vision";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail, rateLimited, getClientIp } from "@/lib/api/response";
import { RateLimiter } from "@/lib/security/rate-limit";

// AI vision calls are expensive — stricter limit: 10/hour per user+IP
const aiRateLimiter = new RateLimiter(10, 60 * 60 * 1000);

const analyzeSchema = {
  image: (v: unknown): v is string => typeof v === "string" && v.startsWith("data:image/"),
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const ip = getClientIp(req);
  const limit = aiRateLimiter.check(`vision:${user.id}:${ip}`);
  if (!limit.success) return rateLimited(limit.resetAt);

  let body: { image?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400, "BAD_BODY");
  }

  if (!analyzeSchema.image(body.image)) {
    return fail("Missing or invalid 'image' (expected data:image/*;base64,...)", 422, "VALIDATION_ERROR");
  }

  try {
    const result = await MealVisionService.analyze(body.image as string);
    return ok(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    if (msg === "INVALID_IMAGE") return fail("Image must be a valid data URL (jpeg/png/webp)", 422, "INVALID_IMAGE");
    if (msg === "IMAGE_TOO_LARGE") return fail("Image too large (max 6MB)", 413, "IMAGE_TOO_LARGE");
    if (msg === "EMPTY_VLM_RESPONSE" || msg === "NO_JSON_IN_RESPONSE" || msg === "INVALID_JSON_RESPONSE") {
      return fail("Could not analyze this image. Try a clearer photo.", 422, "ANALYSIS_FAILED");
    }
    return fail(msg, 500, "SERVER_ERROR");
  }
}
