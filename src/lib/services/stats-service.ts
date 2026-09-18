import { db } from "@/lib/db";
import { DiaryService, type NutritionTotals } from "./diary-service";
import { ExerciseService } from "./exercise-service";
import { toLocalDateString, addDays, parseLocalDate } from "@/lib/utils/date";

export interface DailySummary {
  date: string;
  consumed: NutritionTotals;
  burned: number;
  net: number;
  waterMl: number;
}

export interface DashboardData {
  date: string;
  consumed: NutritionTotals;
  burned: number;
  waterMl: number;
  goal: {
    calorieGoal: number;
    proteinGoalG: number;
    carbGoalG: number;
    fatGoalG: number;
    waterGoalMl: number;
  } | null;
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
  exerciseLogs: unknown[];
  activeFast: unknown | null;
  weight: { weightKg: number; date: string } | null;
  weekly: DailySummary[];
}

/**
 * StatsService — composes dashboard data from multiple services.
 * Demonstrates Dependency Inversion: depends on stable domain operations.
 */
export class StatsService {
  static async getDashboard(userId: string, dateStr: string): Promise<DashboardData> {
    const day = await DiaryService.getDay(userId, dateStr);
    const ex = await ExerciseService.getDay(userId, dateStr);
    const goal = await db.goal.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
    });
    const water = await db.waterLog.findUnique({
      where: { userId_date: { userId, date: parseLocalDate(dateStr) } },
    });
    const activeFast = await db.fastSession.findFirst({
      where: { userId, status: "active" },
      orderBy: { startTime: "desc" },
    });
    const latestWeight = await db.weightLog.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    });

    const consumed = day.consumed;
    const burned = ex.burned;
    const calorieGoal = goal?.calorieGoal ?? 2000;
    const proteinGoalG = goal?.proteinGoalG ?? 120;
    const carbGoalG = goal?.carbGoalG ?? 220;
    const fatGoalG = goal?.fatGoalG ?? 65;
    const waterGoalMl = goal?.waterGoalMl ?? 2000;

    const remaining = {
      calories: Math.round(calorieGoal - consumed.calories + burned),
      protein: Math.round((proteinGoalG - consumed.protein) * 10) / 10,
      carbs: Math.round((carbGoalG - consumed.carbs) * 10) / 10,
      fat: Math.round((fatGoalG - consumed.fat) * 10) / 10,
      water: waterGoalMl - (water?.amountMl ?? 0),
    };

    // weekly summary (7 days ending today)
    const start = addDays(parseLocalDate(dateStr), -6);
    const weekly: DailySummary[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      const key = toLocalDateString(d);
      const dayData = key === dateStr ? day : await DiaryService.getDay(userId, key);
      const exData = key === dateStr ? ex : await ExerciseService.getDay(userId, key);
      const w = await db.waterLog.findUnique({
        where: { userId_date: { userId, date: parseLocalDate(key) } },
      });
      weekly.push({
        date: key,
        consumed: dayData.consumed,
        burned: exData.burned,
        net: Math.round(dayData.consumed.calories - exData.burned),
        waterMl: w?.amountMl ?? 0,
      });
    }

    return {
      date: dateStr,
      consumed,
      burned,
      waterMl: water?.amountMl ?? 0,
      goal: goal
        ? {
            calorieGoal,
            proteinGoalG,
            carbGoalG,
            fatGoalG,
            waterGoalMl,
          }
        : null,
      remaining,
      exerciseLogs: ex.logs,
      activeFast,
      weight: latestWeight
        ? { weightKg: latestWeight.weightKg, date: toLocalDateString(latestWeight.date) }
        : null,
      weekly,
    };
  }
}
