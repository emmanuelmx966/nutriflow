import { NextRequest } from "next/server";
import { MealPlanTemplateService } from "@/lib/services/meal-plan-template-service";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, fail, serverError } from "@/lib/api/response";
import { MealPlanService } from "@/lib/services/meal-plan-service";

/**
 * GET /api/meal-plan/templates — list available templates
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return ok(MealPlanTemplateService.list());
}

/**
 * POST /api/meal-plan/templates — apply a template to a week
 * Body: { templateId: string, week: "YYYY-MM-DD" }
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  let body: { templateId?: string; week?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body", 400, "BAD_BODY");
  }
  const templateId = body.templateId;
  const week = body.week ?? MealPlanService.getWeekStart(new Date()).toISOString().slice(0, 10);
  if (!templateId) return fail("Missing templateId", 422, "VALIDATION_ERROR");
  try {
    const result = await MealPlanTemplateService.applyTemplate(user.id, templateId, week);
    return ok(result, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "TEMPLATE_NOT_FOUND") return fail("Template not found", 404, "NOT_FOUND");
    if (msg === "NO_RECIPES") return fail("Create or like some recipes first to use templates", 400, "NO_RECIPES");
    return serverError(msg);
  }
}
