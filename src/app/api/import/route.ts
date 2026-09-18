import { NextRequest } from "next/server";
import { ImportService } from "@/lib/services/import-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail, serverError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400, "BAD_BODY");
  }

  try {
    const result = await ImportService.importBundle(user.id, body);
    return ok(result, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Import failed";
    if (msg === "INVALID_FORMAT") {
      return fail("Invalid import file format. Expected a NutriFlow JSON export.", 422, "INVALID_FORMAT");
    }
    return serverError(msg);
  }
}
