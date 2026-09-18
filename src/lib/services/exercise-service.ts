import { db } from "@/lib/db";
import { exerciseSearchSchema, exerciseLogCreateSchema, exerciseLogUpdateSchema } from "@/lib/validators";
import { calcExerciseCalories } from "@/lib/nutrition/calculator";
import { parseLocalDate } from "@/lib/utils/date";

/**
 * ExerciseService — exercise catalog + exercise log CRUD.
 * Calories computed via MET formula (met * kg * hours).
 */
export class ExerciseService {
  static async search(input: unknown) {
    const { query, limit } = exerciseSearchSchema.parse(input);
    return db.exercise.findMany({
      where: { name: { contains: query } },
      take: limit,
      orderBy: { name: "asc" },
    });
  }

  static async listCategories() {
    const rows = await db.exercise.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return rows.map((r) => r.category);
  }

  static async addLog(userId: string, userWeightKg: number, input: unknown) {
    const data = exerciseLogCreateSchema.parse(input);
    const date = new Date(data.date);

    let calories = data.caloriesBurned;
    let exerciseId = data.exerciseId;
    if (!calories) {
      // compute from MET if linked exercise, else estimate 6 MET (moderate)
      let met = 6;
      if (data.exerciseId) {
        const ex = await db.exercise.findUnique({ where: { id: data.exerciseId } });
        if (ex) met = ex.metValue;
        else exerciseId = null;
      }
      calories = calcExerciseCalories(met, userWeightKg || 70, data.durationMin);
    }

    return db.exerciseLog.create({
      data: {
        userId,
        date,
        exerciseId,
        exerciseName: data.exerciseName,
        durationMin: data.durationMin,
        caloriesBurned: calories,
      },
    });
  }

  static async updateLog(userId: string, id: string, input: unknown) {
    const data = exerciseLogUpdateSchema.parse(input);
    const log = await db.exerciseLog.findFirst({ where: { id, userId } });
    if (!log) throw new Error("LOG_NOT_FOUND");

    const updates: Record<string, unknown> = {};
    if (data.durationMin !== undefined) {
      updates.durationMin = data.durationMin;
      // recompute if not manually set before — keep ratio
      if (data.caloriesBurned === undefined) {
        const ratio = data.durationMin / (log.durationMin || 1);
        updates.caloriesBurned = Math.round(log.caloriesBurned * ratio);
      }
    }
    if (data.caloriesBurned !== undefined) {
      updates.caloriesBurned = data.caloriesBurned;
    }
    return db.exerciseLog.update({ where: { id }, data: updates });
  }

  static async deleteLog(userId: string, id: string) {
    const log = await db.exerciseLog.findFirst({ where: { id, userId } });
    if (!log) return false;
    await db.exerciseLog.delete({ where: { id } });
    return true;
  }

  static async getDay(userId: string, dateStr: string) {
    const start = parseLocalDate(dateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const logs = await db.exerciseLog.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
    });
    const burned = logs.reduce((s, l) => s + l.caloriesBurned, 0);
    return { burned, logs };
  }
}
