/**
 * PerMealTargetsService — distributes daily macro goals across meals.
 * Single Responsibility: compute per-meal calorie/macro targets.
 */

export interface PerMealTarget {
  meal: string;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  percentage: number;
}

export interface PerMealData {
  targets: PerMealTarget[];
  consumed: Array<{
    meal: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

// Default macro distribution per meal (30/40/25/5 for B/L/D/S)
const DEFAULT_DISTRIBUTION: Record<string, { pct: number }> = {
  breakfast: { pct: 0.3 },
  lunch: { pct: 0.4 },
  dinner: { pct: 0.25 },
  snack: { pct: 0.05 },
};

// Template-specific distributions
const TEMPLATE_DISTRIBUTIONS: Record<string, Record<string, { pct: number }>> = {
  "high-protein": {
    breakfast: { pct: 0.3 },
    lunch: { pct: 0.35 },
    dinner: { pct: 0.3 },
    snack: { pct: 0.05 },
  },
  "low-carb": {
    breakfast: { pct: 0.25 },
    lunch: { pct: 0.4 },
    dinner: { pct: 0.3 },
    snack: { pct: 0.05 },
  },
  "performance": {
    breakfast: { pct: 0.3 },
    lunch: { pct: 0.35 },
    dinner: { pct: 0.3 },
    snack: { pct: 0.05 },
  },
  balanced: DEFAULT_DISTRIBUTION,
  mediterranean: DEFAULT_DISTRIBUTION,
  "plant-forward": DEFAULT_DISTRIBUTION,
};

export class PerMealTargetsService {
  static compute(
    goals: {
      calorieGoal: number;
      proteinGoalG: number;
      carbGoalG: number;
      fatGoalG: number;
    },
    templateId: string = "balanced",
  ): PerMealTarget[] {
    const dist = TEMPLATE_DISTRIBUTIONS[templateId] ?? DEFAULT_DISTRIBUTION;
    const meals = ["breakfast", "lunch", "dinner", "snack"];

    return meals.map((meal) => {
      const pct = dist[meal]?.pct ?? 0.05;
      return {
        meal,
        calorieTarget: Math.round(goals.calorieGoal * pct),
        proteinTarget: Math.round(goals.proteinGoalG * pct),
        carbTarget: Math.round(goals.carbGoalG * pct),
        fatTarget: Math.round(goals.fatGoalG * pct),
        percentage: Math.round(pct * 100),
      };
    });
  }
}
