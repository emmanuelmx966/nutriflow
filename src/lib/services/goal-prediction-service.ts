import { db } from "@/lib/db";
import { toLocalDateString, addDays, parseLocalDate } from "@/lib/utils/date";

/**
 * GoalPredictionService — predicts when the user will reach their weight goal.
 * Single Responsibility: analyze weight trend + project timeline.
 */

export interface GoalPrediction {
  currentWeightKg: number;
  goalWeightKg: number | null;
  goalType: string | null;
  weeklyChangeKg: number; // avg weekly change (negative = losing)
  daysToGoal: number | null; // estimated days to reach goal
  projectedDate: string | null; // ISO date string
  onTrack: boolean; // is the trend in the right direction?
  message: string;
  confidence: "low" | "medium" | "high"; // based on data points
}

export class GoalPredictionService {
  static async predict(userId: string): Promise<GoalPrediction> {
    const [user, goal, weightLogs] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { weightKg: true, goalType: true },
      }),
      db.goal.findFirst({
        where: { userId, active: true },
        orderBy: { createdAt: "desc" },
        select: { weightGoalKg: true },
      }),
      db.weightLog.findMany({
        where: { userId },
        orderBy: { date: "asc" },
        take: 30,
      }),
    ]);

    const currentWeightKg = user?.weightKg ?? 0;
    const goalWeightKg = goal?.weightGoalKg ?? null;
    const goalType = user?.goalType ?? null;

    if (!goalWeightKg || !goalType || weightLogs.length < 2) {
      return {
        currentWeightKg,
        goalWeightKg,
        goalType,
        weeklyChangeKg: 0,
        daysToGoal: null,
        projectedDate: null,
        onTrack: false,
        message: weightLogs.length < 2
          ? "Log your weight regularly to see goal predictions."
          : "Set a weight goal in your profile to see predictions.",
        confidence: "low",
      };
    }

    // Calculate weekly change rate using linear regression on weight logs
    const dataPoints = weightLogs.slice(-10).map((w) => ({
      day: Math.floor((w.date.getTime() - weightLogs[0].date.getTime()) / (1000 * 60 * 60 * 24)),
      weight: w.weightKg,
    }));

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((s, d) => s + d.day, 0);
    const sumY = dataPoints.reduce((s, d) => s + d.weight, 0);
    const sumXY = dataPoints.reduce((s, d) => s + d.day * d.weight, 0);
    const sumX2 = dataPoints.reduce((s, d) => s + d.day * d.day, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
    const dailyChangeKg = slope;
    const weeklyChangeKg = Math.round(dailyChangeKg * 7 * 100) / 100;

    // Determine if on track
    const isLosing = goalType === "lose";
    const isGaining = goalType === "gain";
    const onTrack =
      (isLosing && weeklyChangeKg < 0) ||
      (isGaining && weeklyChangeKg > 0) ||
      (goalType === "maintain" && Math.abs(weeklyChangeKg) < 0.1);

    // Calculate days to goal
    const weightDiff = goalWeightKg - currentWeightKg;
    let daysToGoal: number | null = null;
    let projectedDate: string | null = null;

    if (Math.abs(weightDiff) < 0.1) {
      daysToGoal = 0;
      projectedDate = toLocalDateString(new Date());
    } else if (onTrack && Math.abs(dailyChangeKg) > 0.001) {
      daysToGoal = Math.ceil(Math.abs(weightDiff) / Math.abs(dailyChangeKg));
      if (daysToGoal > 365) daysToGoal = null;
      if (daysToGoal !== null) {
        projectedDate = toLocalDateString(addDays(new Date(), daysToGoal));
      }
    }

    // Confidence based on data points
    const confidence: "low" | "medium" | "high" =
      n >= 7 ? "high" : n >= 4 ? "medium" : "low";

    // Message
    let message: string;
    if (daysToGoal === 0) {
      message = "🎉 You've reached your weight goal! Maintain your current habits.";
    } else if (onTrack && daysToGoal !== null) {
      message = `At this rate, you'll reach your goal in ${daysToGoal} days (${projectedDate}).`;
    } else if (!onTrack) {
      message = isLosing
        ? "Your weight is trending up — adjust your intake to get back on track."
        : isGaining
          ? "Your weight is trending down — increase your intake to reach your goal."
          : "Your weight is fluctuating — log consistently for better predictions.";
    } else {
      message = "Log your weight more frequently for accurate predictions.";
    }

    return {
      currentWeightKg,
      goalWeightKg,
      goalType,
      weeklyChangeKg,
      daysToGoal,
      projectedDate,
      onTrack,
      message,
      confidence,
    };
  }
}
