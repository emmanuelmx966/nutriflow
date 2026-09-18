import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail } from "@/lib/api/response";
import { z } from "zod";

/**
 * GET /api/foods/autocomplete?q=app&limit=8
 * Instant food search suggestions for autocomplete UI.
 * Returns lightweight results (id + name + calories only).
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const query = req.nextUrl.searchParams.get("q") ?? "";
  if (query.length < 1) return ok([]);

  const limit = Math.min(8, Number(req.nextUrl.searchParams.get("limit") ?? 8));
  if (!Number.isFinite(limit)) return fail("Invalid limit", 400);

  const parsed = z.string().trim().min(1).max(100).safeParse(query);
  if (!parsed.success) return ok([]);

  const [foods, custom] = await Promise.all([
    db.food.findMany({
      where: { name: { contains: parsed.data } },
      select: {
        id: true,
        name: true,
        caloriesPer100g: true,
        defaultServingG: true,
        category: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    }),
    db.customFood.findMany({
      where: { userId: user.id, name: { contains: parsed.data } },
      select: {
        id: true,
        name: true,
        caloriesPer100g: true,
        defaultServingG: true,
        category: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    }),
  ]);

  // Combine + mark type, deduplicate by name
  const seen = new Set<string>();
  const results: Array<{
    id: string;
    type: "food" | "custom";
    name: string;
    caloriesPer100g: number;
    defaultServingG: number;
    category: string;
    servingCalories: number;
  }> = [];

  for (const f of foods) {
    if (seen.has(f.name.toLowerCase())) continue;
    seen.add(f.name.toLowerCase());
    results.push({
      id: f.id,
      type: "food",
      name: f.name,
      caloriesPer100g: f.caloriesPer100g,
      defaultServingG: f.defaultServingG,
      category: f.category,
      servingCalories: Math.round((f.caloriesPer100g * f.defaultServingG) / 100),
    });
  }
  for (const f of custom) {
    if (seen.has(f.name.toLowerCase())) continue;
    seen.add(f.name.toLowerCase());
    results.push({
      id: f.id,
      type: "custom",
      name: f.name,
      caloriesPer100g: f.caloriesPer100g,
      defaultServingG: f.defaultServingG,
      category: f.category,
      servingCalories: Math.round((f.caloriesPer100g * f.defaultServingG) / 100),
    });
  }

  return ok(results.slice(0, limit));
}
