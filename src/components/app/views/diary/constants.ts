export const MEAL_IDS = ["breakfast", "lunch", "dinner", "snack"] as const;

export type MealId = (typeof MEAL_IDS)[number];

export const MEAL_LABELS: Record<MealId, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snacks",
};