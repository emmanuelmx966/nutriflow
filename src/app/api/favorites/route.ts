import { NextRequest } from "next/server";
import { FavoritesService } from "@/lib/services/favorites-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail, notFound, serverError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const scope = req.nextUrl.searchParams.get("scope") ?? "favorites";
  try {
    if (scope === "recent") {
      const recent = await FavoritesService.getRecent(user.id, 8);
      return ok(recent);
    }
    const favorites = await FavoritesService.list(user.id, 20);
    return ok(favorites);
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed");
  }
}

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
    await FavoritesService.addManual(user.id, body);
    return ok({ added: true }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("Expected") || msg.includes("required")) {
      return fail("Invalid input", 422, "VALIDATION_ERROR", msg);
    }
    return fail(msg, 400);
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing id param", 400);
  const deleted = await FavoritesService.remove(user.id, id);
  return deleted ? ok({ deleted: true }) : notFound();
}
