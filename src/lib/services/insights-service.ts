import { db } from "@/lib/db";
import { toLocalDateString, addDays, parseLocalDate } from "@/lib/utils/date";

/**
 * InsightsService — gamification + nutrition analytics.
 * Single Responsibility: compute streaks, averages, achievements from logs.
 */

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null;
  totalDaysLogged: number;
}

export interface WeeklyAverage {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji or icon name
  unlocked: boolean;
  progress?: number;
  target?: number;
  unlockedAt?: string;
}

export interface InsightsData {
  streak: StreakInfo;
  weeklyAverages: WeeklyAverage[];
  achievements: Achievement[];
  weeklyAvgCalories: number;
  weeklyAvgProtein: number;
  goalAdherence: number; // % days within goal range
  totalFoodsLogged: number;
  totalExercisesLogged: number;
  totalWaterLogged: number;
  memberSince: string;
}

const ACHIEVEMENT_DEFS: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  metric: "streak" | "foods" | "exercises" | "water" | "adherence";
}> = [
  { id: "first_log", title: "First Steps", description: "Log your first food", icon: "🌱", target: 1, metric: "foods" },
  { id: "streak_3", title: "On a Roll", description: "3-day logging streak", icon: "🔥", target: 3, metric: "streak" },
  { id: "streak_7", title: "Week Warrior", description: "7-day logging streak", icon: "⚡", target: 7, metric: "streak" },
  { id: "streak_30", title: "Monthly Master", description: "30-day logging streak", icon: "👑", target: 30, metric: "streak" },
  { id: "foods_50", title: "Food Explorer", description: "Log 50 foods", icon: "🍎", target: 50, metric: "foods" },
  { id: "foods_100", title: "Centurion", description: "Log 100 foods", icon: "💯", target: 100, metric: "foods" },
  { id: "exercises_10", title: "Getting Active", description: "Log 10 exercises", icon: "🏃", target: 10, metric: "exercises" },
  { id: "water_7", title: "Hydrated Week", description: "Log water 7 days", icon: "💧", target: 7, metric: "water" },
  { id: "adherence_80", title: "Goal Crusher", description: "80% goal adherence", icon: "🎯", target: 80, metric: "adherence" },
];

export class InsightsService {
  static async getInsights(userId: string): Promise<InsightsData> {
    const [streak, weeklyAverages, totals, user] = await Promise.all([
      this.computeStreak(userId),
      this.computeWeeklyAverages(userId),
      this.computeTotals(userId),
      db.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
    ]);

    const goalAdherence = await this.computeGoalAdherence(userId);
    const achievements = this.computeAchievements({
      streak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      foods: totals.totalFoodsLogged,
      exercises: totals.totalExercisesLogged,
      water: totals.waterDaysLogged,
      adherence: goalAdherence,
    });

    const weeklyAvgCalories = weeklyAverages.length
      ? Math.round(weeklyAverages.reduce((s, d) => s + d.calories, 0) / weeklyAverages.length)
      : 0;
    const weeklyAvgProtein = weeklyAverages.length
      ? Math.round((weeklyAverages.reduce((s, d) => s + d.protein, 0) / weeklyAverages.length) * 10) / 10
      : 0;

    return {
      streak,
      weeklyAverages,
      achievements,
      weeklyAvgCalories,
      weeklyAvgProtein,
      goalAdherence,
      totalFoodsLogged: totals.totalFoodsLogged,
      totalExercisesLogged: totals.totalExercisesLogged,
      totalWaterLogged: totals.waterMlTotal,
      memberSince: user?.createdAt.toISOString() ?? new Date().toISOString(),
    };
  }

  private static async computeStreak(userId: string): Promise<StreakInfo> {
    // Get all distinct dates with food logs in last 90 days
    const since = addDays(new Date(), -90);
    const logs = await db.foodLog.findMany({
      where: { userId, date: { gte: since } },
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "desc" },
    });

    const loggedDates = new Set(logs.map((l) => toLocalDateString(l.date)));
    if (loggedDates.size === 0) {
      return { currentStreak: 0, longestStreak: 0, lastLogDate: null, totalDaysLogged: 0 };
    }

    const today = toLocalDateString(new Date());
    const yesterday = toLocalDateString(addDays(new Date(), -1));

    // Current streak: count back from today or yesterday
    let currentStreak = 0;
    let cursor = loggedDates.has(today) ? today : loggedDates.has(yesterday) ? yesterday : null;

    if (cursor) {
      while (loggedDates.has(cursor!)) {
        currentStreak++;
        cursor = toLocalDateString(addDays(parseLocalDate(cursor!), -1));
      }
    }

    // Longest streak: scan all logged dates
    const sortedDates = Array.from(loggedDates).sort();
    let longestStreak = 0;
    let run = 0;
    let prev: string | null = null;
    for (const d of sortedDates) {
      if (prev) {
        const prevDate = parseLocalDate(prev);
        const nextExpected = toLocalDateString(addDays(prevDate, 1));
        if (d === nextExpected) {
          run++;
        } else {
          run = 1;
        }
      } else {
        run = 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prev = d;
    }

    const lastLogDate = sortedDates[sortedDates.length - 1] ?? null;
    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      lastLogDate,
      totalDaysLogged: loggedDates.size,
    };
  }

  private static async computeWeeklyAverages(userId: string): Promise<WeeklyAverage[]> {
    // Last 7 days
    const start = addDays(new Date(), -6);
    const startStr = toLocalDateString(start);
    const logs = await db.foodLog.findMany({
      where: { userId, date: { gte: parseLocalDate(startStr) } },
      select: { date: true, calories: true, proteinG: true, carbsG: true, fatG: true },
    });

    const byDay = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
    for (const l of logs) {
      const key = toLocalDateString(l.date);
      const cur = byDay.get(key) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
      cur.calories += l.calories;
      cur.protein += l.proteinG;
      cur.carbs += l.carbsG;
      cur.fat += l.fatG;
      byDay.set(key, cur);
    }

    const result: WeeklyAverage[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(parseLocalDate(startStr), i);
      const key = toLocalDateString(d);
      const data = byDay.get(key) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
      result.push({
        date: key,
        calories: Math.round(data.calories),
        protein: Math.round(data.protein * 10) / 10,
        carbs: Math.round(data.carbs * 10) / 10,
        fat: Math.round(data.fat * 10) / 10,
      });
    }
    return result;
  }

  private static async computeTotals(userId: string): Promise<{
    totalFoodsLogged: number;
    totalExercisesLogged: number;
    waterMlTotal: number;
    waterDaysLogged: number;
  }> {
    const [foodCount, exerciseCount, waterLogs] = await Promise.all([
      db.foodLog.count({ where: { userId } }),
      db.exerciseLog.count({ where: { userId } }),
      db.waterLog.findMany({ where: { userId }, select: { amountMl: true } }),
    ]);

    const waterMlTotal = waterLogs.reduce((s, w) => s + w.amountMl, 0);
    return {
      totalFoodsLogged: foodCount,
      totalExercisesLogged: exerciseCount,
      waterMlTotal,
      waterDaysLogged: waterLogs.length,
    };
  }

  private static async computeGoalAdherence(userId: string): Promise<number> {
    const goal = await db.goal.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!goal) return 0;

    const since = addDays(new Date(), -7);
    const logs = await db.foodLog.findMany({
      where: { userId, date: { gte: since } },
      select: { date: true, calories: true },
    });

    const byDay = new Map<string, number>();
    for (const l of logs) {
      const key = toLocalDateString(l.date);
      byDay.set(key, (byDay.get(key) ?? 0) + l.calories);
    }

    if (byDay.size === 0) return 0;

    // Adherence: within ±15% of calorie goal
    const lower = goal.calorieGoal * 0.85;
    const upper = goal.calorieGoal * 1.15;
    let within = 0;
    for (const cals of byDay.values()) {
      if (cals >= lower && cals <= upper) within++;
    }
    return Math.round((within / byDay.size) * 100);
  }

  private static computeAchievements(metrics: {
    streak: number;
    longestStreak: number;
    foods: number;
    exercises: number;
    water: number;
    adherence: number;
  }): Achievement[] {
    return ACHIEVEMENT_DEFS.map((def) => {
      const value =
        def.metric === "streak"
          ? Math.max(metrics.streak, metrics.longestStreak)
          : def.metric === "foods"
            ? metrics.foods
            : def.metric === "exercises"
              ? metrics.exercises
              : def.metric === "water"
                ? metrics.water
                : metrics.adherence;
      const unlocked = value >= def.target;
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        unlocked,
        progress: Math.min(value, def.target),
        target: def.target,
      };
    });
  }
}
