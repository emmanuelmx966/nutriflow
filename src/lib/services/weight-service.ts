import { db } from "@/lib/db";
import { weightLogSchema } from "@/lib/validators";
import { parseLocalDate, toLocalDateString } from "@/lib/utils/date";

/**
 * WeightService — weight history tracking.
 */
export class WeightService {
  static async upsert(userId: string, input: unknown) {
    const data = weightLogSchema.parse(input);
    const date = parseLocalDate(toLocalDateString(new Date(data.date)));
    const log = await db.weightLog.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, weightKg: data.weightKg, note: data.note },
      update: { weightKg: data.weightKg, note: data.note },
    });
    // sync user.weightKg for calorie math
    await db.user.update({
      where: { id: userId },
      data: { weightKg: data.weightKg },
    });
    return log;
  }

  static async history(userId: string, days = 90) {
    const start = new Date();
    start.setDate(start.getDate() - days);
    return db.weightLog.findMany({
      where: { userId, date: { gte: start } },
      orderBy: { date: "asc" },
    });
  }

  static async latest(userId: string) {
    return db.weightLog.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    });
  }

  static async delete(userId: string, id: string) {
    const log = await db.weightLog.findFirst({ where: { id, userId } });
    if (!log) return false;
    await db.weightLog.delete({ where: { id } });
    return true;
  }
}
