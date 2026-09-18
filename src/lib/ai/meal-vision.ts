import ZAI from "z-ai-web-dev-sdk";
import { z } from "zod";

/**
 * MealVisionService — AI photo food recognition (MFP premium feature).
 * Uses the z-ai VLM (glm-4.6v) to identify foods in a photo and estimate
 * nutrition. Single Responsibility: vision → structured nutrition estimate.
 */

const ESTIMATE_SCHEMA = z.object({
  foods: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        portionGrams: z.number().min(1).max(2000),
        calories: z.number().min(0).max(3000),
        proteinG: z.number().min(0).max(200),
        carbsG: z.number().min(0).max(500),
        fatG: z.number().min(0).max(200),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1)
    .max(8),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  summary: z.string().max(200),
});

export type MealEstimate = z.infer<typeof ESTIMATE_SCHEMA>;

export interface AnalyzedFood {
  name: string;
  portionGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: number;
}

export interface MealAnalysisResult {
  foods: AnalyzedFood[];
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  summary: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

const PROMPT = `You are a precision nutrition analyst. Analyze this meal photo and estimate the nutrition.

Identify each distinct food item visible. For each, estimate:
- name (concise, e.g. "Grilled chicken breast", "Steamed broccoli", "White rice")
- portionGrams (realistic portion size in grams based on what you see)
- calories (kcal for that portion)
- proteinG, carbsG, fatG (grams for that portion)
- confidence (0-1, how certain you are about identification + portion)

Also classify the meal type (breakfast/lunch/dinner/snack) based on the foods.

Return STRICT JSON only (no markdown, no commentary) in this exact shape:
{
  "foods": [
    { "name": "...", "portionGrams": 150, "calories": 250, "proteinG": 30, "carbsG": 0, "fatG": 11, "confidence": 0.85 }
  ],
  "mealType": "lunch",
  "summary": "Brief one-line description of the meal"
}

Rules:
- Be conservative on portions if uncertain.
- If you cannot identify any food, return { "foods": [], "mealType": "snack", "summary": "Could not identify foods" }.
- Output ONLY the JSON object.`;

export class MealVisionService {
  /**
   * Analyze a meal photo (base64 data URL) and return structured nutrition estimate.
   */
  static async analyze(imageDataUrl: string): Promise<MealAnalysisResult> {
    // Validate it's a data URL with an image MIME
    if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(imageDataUrl)) {
      throw new Error("INVALID_IMAGE");
    }
    // Reject images larger than ~6MB (base64 inflates ~33%)
    const sizeBytes = Math.ceil((imageDataUrl.length - imageDataUrl.indexOf(",")) * 0.75);
    if (sizeBytes > 6 * 1024 * 1024) {
      throw new Error("IMAGE_TOO_LARGE");
    }

    const zai = await ZAI.create();
    const response = await zai.chat.completions.createVision({
      model: "glm-4.6v",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const raw = response.choices?.[0]?.message?.content ?? "";
    const parsed = this.parseResponse(raw);
    const validated = ESTIMATE_SCHEMA.parse(parsed);

    const totals = validated.foods.reduce(
      (acc, f) => {
        acc.calories += f.calories;
        acc.protein += f.proteinG;
        acc.carbs += f.carbsG;
        acc.fat += f.fatG;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return {
      foods: validated.foods.map((f) => ({
        name: f.name,
        portionGrams: Math.round(f.portionGrams),
        calories: Math.round(f.calories),
        proteinG: Math.round(f.proteinG * 10) / 10,
        carbsG: Math.round(f.carbsG * 10) / 10,
        fatG: Math.round(f.fatG * 10) / 10,
        confidence: Math.round(f.confidence * 100) / 100,
      })),
      mealType: validated.mealType,
      summary: validated.summary,
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalCarbs: Math.round(totals.carbs * 10) / 10,
      totalFat: Math.round(totals.fat * 10) / 10,
    };
  }

  /**
   * The VLM may wrap JSON in markdown fences or add prose. Extract the JSON object.
   */
  private static parseResponse(raw: string): unknown {
    if (!raw) throw new Error("EMPTY_VLM_RESPONSE");
    let text = raw.trim();
    // Strip markdown code fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1].trim();
    // Find the first { and last }
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first === -1 || last === -1 || last <= first) {
      throw new Error("NO_JSON_IN_RESPONSE");
    }
    const jsonStr = text.slice(first, last + 1);
    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error("INVALID_JSON_RESPONSE");
    }
  }
}
