import type { DashboardData } from "@/lib/api-client";

/**
 * TipsService — contextual nutrition tips based on today's data.
 * Single Responsibility: analyze dashboard data + generate actionable advice.
 */

export interface NutritionTip {
  id: string;
  category: "protein" | "carbs" | "fat" | "calories" | "water" | "fasting" | "streak" | "general";
  icon: string;
  title: string;
  message: string;
  tone: "good" | "warning" | "info";
}

export class TipsService {
  static generate(data: DashboardData): NutritionTip[] {
    const tips: NutritionTip[] = [];
    const { consumed, goal, waterMl, burned, remaining } = data;

    if (!goal) {
      tips.push({
        id: "set-goals",
        category: "general",
        icon: "🎯",
        title: "Set your goals",
        message: "Complete your profile to get personalized calorie and macro targets.",
        tone: "info",
      });
      return tips;
    }

    // Protein tip
    const proteinPct = goal.proteinGoalG > 0 ? consumed.protein / goal.proteinGoalG : 0;
    if (proteinPct < 0.5 && consumed.calories > 100) {
      tips.push({
        id: "low-protein",
        category: "protein",
        icon: "🥩",
        title: "Boost your protein",
        message: `You're at ${Math.round(consumed.protein)}g of ${goal.proteinGoalG}g. Try Greek yogurt, eggs, or chicken.`,
        tone: "warning",
      });
    } else if (proteinPct >= 0.8) {
      tips.push({
        id: "good-protein",
        category: "protein",
        icon: "💪",
        title: "Great protein intake!",
        message: `You've hit ${Math.round(consumed.protein)}g of your ${goal.proteinGoalG}g goal.`,
        tone: "good",
      });
    }

    // Water tip
    const waterPct = goal.waterGoalMl > 0 ? waterMl / goal.waterGoalMl : 0;
    if (waterPct < 0.5) {
      tips.push({
        id: "low-water",
        category: "water",
        icon: "💧",
        title: "Stay hydrated",
        message: `You've had ${waterMl}ml of ${goal.waterGoalMl}ml. Drink a glass now!`,
        tone: "warning",
      });
    } else if (waterPct >= 1) {
      tips.push({
        id: "good-water",
        category: "water",
        icon: "🌊",
        title: "Hydration goal met!",
        message: `You've hit ${waterMl}ml — excellent hydration today.`,
        tone: "good",
      });
    }

    // Calorie balance
    const netCalories = consumed.calories - burned;
    if (remaining.calories < 0 && consumed.calories > 0) {
      tips.push({
        id: "over-calories",
        category: "calories",
        icon: "⚠️",
        title: "Over calorie goal",
        message: `You're ${Math.abs(remaining.calories)} kcal over. Try a walk to burn ${Math.round(Math.abs(remaining.calories) * 0.5)} kcal.`,
        tone: "warning",
      });
    } else if (remaining.calories > 0 && remaining.calories < goal.calorieGoal * 0.2 && consumed.calories > 0) {
      tips.push({
        id: "near-goal",
        category: "calories",
        icon: "✨",
        title: "Almost there!",
        message: `Only ${remaining.calories} kcal left for today. Choose wisely!`,
        tone: "info",
      });
    }

    // Fasting tip
    if (data.activeFast) {
      tips.push({
        id: "fasting-active",
        category: "fasting",
        icon: "⏱️",
        title: "Fasting in progress",
        message: `You're ${data.activeFast.protocolHours}:8 fasting. Stay strong!`,
        tone: "good",
      });
    }

    // Exercise tip
    if (burned > 0) {
      tips.push({
        id: "exercised",
        category: "calories",
        icon: "🏃",
        title: "Great workout!",
        message: `You burned ${Math.round(burned)} kcal through exercise today.`,
        tone: "good",
      });
    } else if (consumed.calories > goal.calorieGoal * 0.7) {
      tips.push({
        id: "suggest-exercise",
        category: "calories",
        icon: "🚶",
        title: "Consider a walk",
        message: `A 30-min walk would burn ~150 kcal and help reach your goals.`,
        tone: "info",
      });
    }

    // If nothing logged yet
    if (consumed.calories === 0 && waterMl === 0) {
      tips.push({
        id: "start-logging",
        category: "general",
        icon: "🌱",
        title: "Start logging today",
        message: "Log your first meal or water to start tracking your nutrition.",
        tone: "info",
      });
    }

    // Limit to 3 tips, prioritize warnings
    const warnings = tips.filter((t) => t.tone === "warning");
    const goods = tips.filter((t) => t.tone === "good");
    const infos = tips.filter((t) => t.tone === "info");
    return [...warnings, ...goods, ...infos].slice(0, 3);
  }
}
