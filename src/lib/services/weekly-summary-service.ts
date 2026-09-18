import { db } from "@/lib/db";
import { toLocalDateString, addDays, parseLocalDate } from "@/lib/utils/date";

/**
 * WeeklySummaryService — 7-day nutrition averages + trends.
 * Single Responsibility: compute weekly stats from food logs.
 */

export interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
}

export interface WeeklySummary {
  days: DailyNutrition[];
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  totalWater: number;
  trendCalories: number; // % change vs previous week
  trendProtein: number;
  daysLogged: number;
  bestDay: { date: string; calories: number } | null;
  consistencyScore: number; // % of days logged
}

export class WeeklySummaryService {
  static async getSummary(userId: string): Promise<WeeklySummary> {
    const today = new Date();
    const thisWeekStart = addDays(today, -6);
    const lastWeekStart = addDays(today, -13);
    const lastWeekEnd = addDays(today, -7);

    const [thisWeekLogs, lastWeekLogs, thisWeekWater, lastWeekWater] = await Promise.all([
      this.getLogsForRange(userId, toLocalDateString(thisWeekStart), toLocalDateString(today)),
      this.getLogsForRange(userId, toLocalDateString(lastWeekStart), toLocalDateString(lastWeekEnd)),
      this.getWaterForRange(userId, toLocalDateString(thisWeekStart), toLocalDateString(today)),
      this.getWaterForRange(userId, toLocalDateString(lastWeekStart), toLocalDateString(lastWeekEnd)),
    ]);

    // Build daily arrays for this week
    const days: DailyNutrition[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(thisWeekStart, i);
      const dateStr = toLocalDateString(d);
      const logs = thisWeekLogs.filter((l) => toLocalDateString(l.date) === dateStr);
      const water = thisWeekWater.find((w) => toLocalDateString(w.date) === dateStr);
      days.push({
        date: dateStr,
        calories: Math.round(logs.reduce((s, l) => s + l.calories, 0)),
        protein: Math.round(logs.reduce((s, l) => s + l.proteinG, 0) * 10) / 10,
        carbs: Math.round(logs.reduce((s, l) => s + l.carbsG, 0) * 10) / 10,
        fat: Math.round(logs.reduce((s, l) => s + l.fatG, 0) * 10) / 10,
        waterMl: water?.amountMl ?? 0,
      });
    }

    const daysLogged = days.filter((d) => d.calories > 0).length;
    const avgCalories = daysLogged > 0
      ? Math.round(days.reduce((s, d) => s + d.calories, 0) / daysLogged)
      : 0;
    const avgProtein = daysLogged > 0
      ? Math.round(((days.reduce((s, d) => s + d.protein, 0) / daysLogged) * 10)) / 10
      : 0;
    const avgCarbs = daysLogged > 0
      ? Math.round(((days.reduce((s, d) => s + d.carbs, 0) / daysLogged) * 10)) / 10
      : 0;
    const avgFat = daysLogged > 0
      ? Math.round(((days.reduce((s, d) => s + d.fat, 0) / daysLogged) * 10)) / 10
      : 0;
    const totalWater = days.reduce((s, d) => s + d.waterMl, 0);

    // Trend: compare this week avg vs last week avg
    // BUG FIX: lastWeek must be divided by lastWeekDaysLogged (not 7) to match
    // the same averaging basis used for this week (which divides by daysLogged).
    const lastWeekDaysLogged = new Set(
      lastWeekLogs.map((l) => toLocalDateString(l.date)),
    ).size;
    const lastWeekCalories = lastWeekDaysLogged > 0
      ? lastWeekLogs.reduce((s, l) => s + l.calories, 0) / lastWeekDaysLogged
      : 0;
    const lastWeekProtein = lastWeekDaysLogged > 0
      ? lastWeekLogs.reduce((s, l) => s + l.proteinG, 0) / lastWeekDaysLogged
      : 0;
    const trendCalories = lastWeekDaysLogged > 0 && lastWeekCalories > 0
      ? Math.round(((avgCalories - lastWeekCalories) / lastWeekCalories) * 100)
      : 0;
    const trendProtein = lastWeekDaysLogged > 0 && lastWeekProtein > 0
      ? Math.round(((avgProtein - lastWeekProtein) / lastWeekProtein) * 100)
      : 0;

    // Best day: if a calorie goal exists, pick the day closest to it.
    // If no goal, fall back to the day with the most calories (peakDay).
    const calorieGoal = await db.goal.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
      select: { calorieGoal: true },
    });
    const loggedDays = days.filter((d) => d.calories > 0);
    let bestDay: DailyNutrition | null = null;
    if (loggedDays.length > 0) {
      if (calorieGoal) {
        bestDay = loggedDays.reduce((best, d) =>
          Math.abs(d.calories - calorieGoal.calorieGoal) < Math.abs(best.calories - calorieGoal.calorieGoal)
            ? d
            : best,
        loggedDays[0]);
      } else {
        // Fallback: day with the most calories (peak day)
        bestDay = loggedDays.reduce((best, d) =>
          d.calories > best.calories ? d : best,
        loggedDays[0]);
      }
    }

    const consistencyScore = Math.round((daysLogged / 7) * 100);

    return {
      days,
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      totalWater,
      trendCalories,
      trendProtein,
      daysLogged,
      bestDay: bestDay?.calories ? { date: bestDay.date, calories: bestDay.calories } : null,
      consistencyScore,
    };
  }

  private static async getLogsForRange(userId: string, startStr: string, endStr: string) {
    const start = parseLocalDate(startStr);
    const end = addDays(parseLocalDate(endStr), 1);
    return db.foodLog.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { date: true, calories: true, proteinG: true, carbsG: true, fatG: true },
    });
  }

  private static async getWaterForRange(userId: string, startStr: string, endStr: string) {
    const start = parseLocalDate(startStr);
    const end = addDays(parseLocalDate(endStr), 1);
    return db.waterLog.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { date: true, amountMl: true },
    });
  }
}