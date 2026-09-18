import { db } from "@/lib/db";
import { toLocalDateString } from "@/lib/utils/date";

/**
 * ExportService — data portability (CSV + JSON).
 * Lets users download their own nutrition data — critical for trust.
 * Single Responsibility: serialize user data for export.
 */

export interface ExportBundle {
  user: {
    email: string;
    name: string | null;
    exportedAt: string;
  };
  profile: unknown;
  goals: unknown[];
  foodLogs: unknown[];
  exerciseLogs: unknown[];
  weightLogs: unknown[];
  waterLogs: unknown[];
  fastSessions: unknown[];
  recipes: unknown[];
}

export class ExportService {
  static async bundle(userId: string): Promise<ExportBundle> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        gender: true,
        birthDate: true,
        heightCm: true,
        weightKg: true,
        activityLevel: true,
        goalType: true,
        weeklyGoalKg: true,
        createdAt: true,
      },
    });
    if (!user) throw new Error("USER_NOT_FOUND");

    const [goals, foodLogs, exerciseLogs, weightLogs, waterLogs, fastSessions, recipes] =
      await Promise.all([
        db.goal.findMany({ where: { userId } }),
        db.foodLog.findMany({ where: { userId }, orderBy: { date: "desc" } }),
        db.exerciseLog.findMany({ where: { userId }, orderBy: { date: "desc" } }),
        db.weightLog.findMany({ where: { userId }, orderBy: { date: "desc" } }),
        db.waterLog.findMany({ where: { userId }, orderBy: { date: "desc" } }),
        db.fastSession.findMany({ where: { userId }, orderBy: { startTime: "desc" } }),
        db.recipe.findMany({ where: { userId }, include: { ingredients: true } }),
      ]);

    return {
      user: {
        email: user.email,
        name: user.name,
        exportedAt: new Date().toISOString(),
      },
      profile: {
        ...user,
        birthDate: user.birthDate?.toISOString() ?? null,
        passwordHash: undefined,
      },
      goals,
      foodLogs,
      exerciseLogs,
      weightLogs,
      waterLogs,
      fastSessions,
      recipes,
    };
  }

  static async json(userId: string): Promise<string> {
    const bundle = await this.bundle(userId);
    return JSON.stringify(bundle, null, 2);
  }

  static async csv(userId: string): Promise<string> {
    const bundle = await this.bundle(userId);
    const lines: string[] = [];

    // Food logs CSV
    lines.push("Section,Date,Meal/Type,Name,Quantity,Calories,Protein,Carbs,Fat,Note");
    for (const l of bundle.foodLogs as Array<Record<string, unknown>>) {
      lines.push(
        [
          "Food",
          toLocalDateString(new Date(l.date as string)),
          l.meal,
          csvEscape(l.foodName as string),
          `${l.quantityG}g`,
          l.calories,
          `${l.proteinG}g`,
          `${l.carbsG}g`,
          `${l.fatG}g`,
          "",
        ].join(","),
      );
    }
    for (const l of bundle.exerciseLogs as Array<Record<string, unknown>>) {
      lines.push(
        [
          "Exercise",
          toLocalDateString(new Date(l.date as string)),
          "—",
          csvEscape(l.exerciseName as string),
          `${l.durationMin}min`,
          l.caloriesBurned,
          "—",
          "—",
          "—",
          "",
        ].join(","),
      );
    }
    for (const l of bundle.weightLogs as Array<Record<string, unknown>>) {
      lines.push(
        [
          "Weight",
          toLocalDateString(new Date(l.date as string)),
          "—",
          "Weigh-in",
          `${l.weightKg}kg`,
          "—",
          "—",
          "—",
          "—",
          csvEscape(((l.note as string) ?? "")),
        ].join(","),
      );
    }
    for (const l of bundle.waterLogs as Array<Record<string, unknown>>) {
      lines.push(
        [
          "Water",
          toLocalDateString(new Date(l.date as string)),
          "—",
          "Water",
          `${l.amountMl}ml`,
          "—",
          "—",
          "—",
          "—",
          "",
        ].join(","),
      );
    }
    for (const l of bundle.fastSessions as Array<Record<string, unknown>>) {
      lines.push(
        [
          "Fast",
          toLocalDateString(new Date(l.startTime as string)),
          `${l.protocolHours}h`,
          `Fast (${l.status})`,
          "—",
          "—",
          "—",
          "—",
          "—",
          "",
        ].join(","),
      );
    }

    return lines.join("\n");
  }
}

function csvEscape(s: string): string {
  if (!s) return "";
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
