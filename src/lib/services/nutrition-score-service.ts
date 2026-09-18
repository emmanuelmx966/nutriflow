import { db } from "@/lib/db";
import { toLocalDateString, addDays, parseLocalDate } from "@/lib/utils/date";

/**
 * NutritionScoreService — composite health metric (0-100).
 * Single Responsibility: compute a daily + weekly nutrition score from
 * macro adherence, food variety, and logging consistency.
 */

export interface NutritionScore {
  todayScore: number;
  weekScore: number;
  trend: number; // difference from 7 days ago
  components: {
    macroAdherence: number; // 0-100: how close to calorie/macro goals
    foodVariety: number; // 0-100: distinct foods logged
    consistency: number; // 0-100: days logged in last 7
    hydration: number; // 0-100: water goal adherence
  };
  grade: "A" | "B" | "C" | "D" | "F";
  message: string;
}

export class NutritionScoreService {
  static async compute(userId: string): Promise<NutritionScore> {
    const today = toLocalDateString(new Date());
    const weekAgo = toLocalDateString(addDays(new Date(), -7));

    const [todayData, weekData, goal, waterLogs, distinctFoods] = await Promise.all([
      this.getDayData(userId, today),
      this.getWeekData(userId, weekAgo, today),
      db.goal.findFirst({ where: { userId, active: true }, orderBy: { createdAt: "desc" } }),
      db.waterLog.findMany({
        where: { userId, date: { gte: parseLocalDate(weekAgo) } },
      }),
      db.foodLog.findMany({
        where: { userId, date: { gte: parseLocalDate(weekAgo) } },
        select: { foodName: true },
        distinct: ["foodName"],
      }),
    ]);

    const components = {
      macroAdherence: this.computeMacroAdherence(todayData, goal),
      foodVariety: this.computeFoodVariety(distinctFoods.length),
      consistency: this.computeConsistency(weekData.daysLogged),
      hydration: this.computeHydration(waterLogs, goal?.waterGoalMl ?? 2000),
    };

    // Weighted composite: adherence 40%, consistency 30%, variety 20%, hydration 10%
    const todayScore = Math.round(
      components.macroAdherence * 0.4 +
      components.consistency * 0.3 +
      components.foodVariety * 0.2 +
      components.hydration * 0.1,
    );

    // Weekly score: average of all components over the week
    const weekScore = Math.round(
      (components.macroAdherence + components.consistency + components.foodVariety + components.hydration) / 4,
    );

    // Trend: compare today's score vs 7 days ago (simplified — use consistency delta)
    const trend = weekData.daysLogged >= 4 ? 5 : weekData.daysLogged >= 2 ? 0 : -10;

    const grade = this.scoreToGrade(todayScore);
    const message = this.scoreMessage(todayScore, grade);

    const result: NutritionScore = {
      todayScore: Math.min(100, Math.max(0, todayScore)),
      weekScore: Math.min(100, Math.max(0, weekScore)),
      trend,
      components,
      grade,
      message,
    };

    // Persist to score history (upsert by date)
    await this.saveHistory(userId, result);

    return result;
  }

  /**
   * Save today's score to history for trend tracking.
   */
  private static async saveHistory(userId: string, score: NutritionScore): Promise<void> {
    try {
      const today = parseLocalDate(toLocalDateString(new Date()));
      await db.scoreHistory.upsert({
        where: { userId_date: { userId, date: today } },
        create: {
          userId,
          date: today,
          score: score.todayScore,
          grade: score.grade,
          macroAdherence: score.components.macroAdherence,
          foodVariety: score.components.foodVariety,
          consistency: score.components.consistency,
          hydration: score.components.hydration,
        },
        update: {
          score: score.todayScore,
          grade: score.grade,
          macroAdherence: score.components.macroAdherence,
          foodVariety: score.components.foodVariety,
          consistency: score.components.consistency,
          hydration: score.components.hydration,
        },
      });
    } catch {
      // non-fatal — score history is best-effort
    }
  }

  /**
   * Get score history for the last N days (for charting).
   */
  static async getHistory(userId: string, days = 14): Promise<Array<{
    date: string;
    score: number;
    grade: string;
    macroAdherence: number;
    foodVariety: number;
    consistency: number;
    hydration: number;
  }>> {
    const since = addDays(parseLocalDate(toLocalDateString(new Date())), -(days - 1));
    const records = await db.scoreHistory.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: "asc" },
    });
    return records.map((r) => ({
      date: toLocalDateString(r.date),
      score: r.score,
      grade: r.grade,
      macroAdherence: r.macroAdherence,
      foodVariety: r.foodVariety,
      consistency: r.consistency,
      hydration: r.hydration,
    }));
  }

  private static async getDayData(userId: string, dateStr: string) {
    const start = parseLocalDate(dateStr);
    const end = addDays(start, 1);
    const logs = await db.foodLog.findMany({
      where: { userId, date: { gte: start, lt: end } },
    });
    return {
      calories: logs.reduce((s, l) => s + l.calories, 0),
      protein: logs.reduce((s, l) => s + l.proteinG, 0),
      carbs: logs.reduce((s, l) => s + l.carbsG, 0),
      fat: logs.reduce((s, l) => s + l.fatG, 0),
    };
  }

  private static async getWeekData(userId: string, startStr: string, endStr: string) {
    const start = parseLocalDate(startStr);
    const end = parseLocalDate(endStr);
    const logs = await db.foodLog.findMany({
      where: { userId, date: { gte: start, lt: addDays(end, 1) } },
      select: { date: true },
      distinct: ["date"],
    });
    return { daysLogged: logs.length };
  }

  /**
   * Macro adherence: how close consumed is to goal (within ±15% = full marks).
   */
  private static computeMacroAdherence(
    consumed: { calories: number; protein: number; carbs: number; fat: number },
    goal: { calorieGoal: number; proteinGoalG: number; carbGoalG: number; fatGoalG: number } | null,
  ): number {
    if (!goal || consumed.calories === 0) return 0;

    const calRatio = Math.min(1, consumed.calories / goal.calorieGoal);
    const proteinRatio = goal.proteinGoalG > 0 ? Math.min(1, consumed.protein / goal.proteinGoalG) : 0.5;
    const carbRatio = goal.carbGoalG > 0 ? Math.min(1, consumed.carbs / goal.carbGoalG) : 0.5;
    const fatRatio = goal.fatGoalG > 0 ? Math.min(1, consumed.fat / goal.fatGoalG) : 0.5;

    // Penalize over-consumption
    const calScore = consumed.calories > goal.calorieGoal * 1.15
      ? Math.max(0, 100 - (consumed.calories - goal.calorieGoal) / goal.calorieGoal * 100)
      : calRatio * 100;

    return Math.round((calScore + proteinRatio * 100 + carbRatio * 100 + fatRatio * 100) / 4);
  }

  /**
   * Food variety: more distinct foods = higher score.
   * 1 food = 20, 5+ = 100.
   */
  private static computeFoodVariety(distinctCount: number): number {
    if (distinctCount === 0) return 0;
    if (distinctCount >= 8) return 100;
    return Math.round((distinctCount / 8) * 100);
  }

  /**
   * Consistency: days logged in last 7.
   */
  private static computeConsistency(daysLogged: number): number {
    return Math.round((Math.min(7, daysLogged) / 7) * 100);
  }

  /**
   * Hydration: water goal adherence over the week.
   */
  private static computeHydration(
    waterLogs: Array<{ amountMl: number }>,
    goalMl: number,
  ): number {
    if (waterLogs.length === 0) return 0;
    const daysHit = waterLogs.filter((w) => w.amountMl >= goalMl).length;
    const avgAdherence = waterLogs.reduce((s, w) => s + Math.min(1, w.amountMl / goalMl), 0) / 7;
    return Math.round(((daysHit / 7) * 60 + avgAdherence * 40));
  }

  private static scoreToGrade(score: number): NutritionScore["grade"] {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  private static scoreMessage(score: number, grade: NutritionScore["grade"]): string {
    if (grade === "A") return "Excellent! You're crushing your nutrition goals.";
    if (grade === "B") return "Great work! Almost at your targets.";
    if (grade === "C") return "Good progress. Keep logging consistently.";
    if (grade === "D") return "Getting started — log more meals to improve.";
    return "Begin tracking to see your nutrition score.";
  }
}
