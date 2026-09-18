import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

/**
 * Unified API response helpers — consistent shape for all endpoints.
 */
export type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(error: string, status = 400, code?: string, details?: unknown) {
  return NextResponse.json<ApiError>(
    { error, code, details },
    { status },
  );
}

export function unauthorized() {
  return fail("Authentication required", 401, "UNAUTHORIZED");
}

export function forbidden() {
  return fail("You do not have access to this resource", 403, "FORBIDDEN");
}

export function notFound(msg = "Resource not found") {
  return fail(msg, 404, "NOT_FOUND");
}

export function validationError(err: ZodError) {
  const details = err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return fail("Invalid input", 422, "VALIDATION_ERROR", details);
}

export function serverError(msg = "Something went wrong") {
  return fail(msg, 500, "SERVER_ERROR");
}

export function rateLimited(resetAt: number) {
  return NextResponse.json<ApiError>(
    { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
    {
      status: 429,
      headers: {
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    },
  );
}

export async function parseBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<{ data?: T; error?: NextResponse }> {
  try {
    const json = await req.json();
    const data = schema.parse(json);
    return { data };
  } catch (e) {
    if (e instanceof ZodError) return { error: validationError(e) };
    return { error: fail("Invalid JSON body", 400, "BAD_BODY") };
  }
}

export function parseQuery<T>(params: URLSearchParams, schema: z.ZodSchema<T>): { data?: T; error?: NextResponse } {
  try {
    const obj: Record<string, string | string[]> = {};
    params.forEach((value, key) => {
      const existing = obj[key];
      if (existing === undefined) obj[key] = value;
      else if (Array.isArray(existing)) existing.push(value);
      else obj[key] = [existing, value];
    });
    const data = schema.parse(obj);
    return { data };
  } catch (e) {
    if (e instanceof ZodError) return { error: validationError(e) };
    return { error: fail("Invalid query", 400, "BAD_QUERY") };
  }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
