import { NextRequest } from "next/server";
import { ExportService } from "@/lib/services/export-service";
import { getCurrentUser } from "@/lib/auth";
import { unauthorized, fail } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const format = (req.nextUrl.searchParams.get("format") ?? "json").toLowerCase();
  if (format !== "json" && format !== "csv") {
    return fail("format must be 'json' or 'csv'", 400);
  }
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      const csv = await ExportService.csv(user.id);
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="nutriflow-export-${stamp}.csv"`,
        },
      });
    }
    const json = await ExportService.json(user.id);
    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="nutriflow-export-${stamp}.json"`,
      },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Export failed", 500);
  }
}
