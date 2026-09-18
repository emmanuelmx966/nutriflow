import { NextRequest } from "next/server";
import { FoodService } from "@/lib/services/food-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound } from "@/lib/api/response";

/**
 * GET /api/barcode?code=<digits>
 * Looks up a food by its barcode (EAN/UPC).
 * This endpoint powers the manual barcode entry UI (camera-ready).
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const code = req.nextUrl.searchParams.get("code") ?? "";
  if (!/^\d{8,14}$/.test(code)) {
    return notFound("Invalid barcode format");
  }
  const result = await FoodService.getByBarcode(user.id, code);
  if (!result) return notFound("No food found for this barcode");
  return ok(result);
}
