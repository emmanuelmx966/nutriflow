import { NextRequest } from "next/server";
import { WeightService } from "@/lib/services/weight-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound } from "@/lib/api/response";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const deleted = await WeightService.delete(user.id, id);
  return deleted ? ok({ deleted: true }) : notFound();
}
