import { db } from "@/lib/db";
import { waterLogSchema } from "@/lib/validators";
import { parseLocalDate, toLocalDateString } from "@/lib/utils/date";

/**
 * WaterService — daily water intake tracking.
 */
export class WaterService {
  static async set(userId: string, input: unknown) {
    const data = waterLogSchema.parse(input);
    const date = parseLocalDate(toLocalDateString(new Date(data.date)));
    return db.waterLog.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, amountMl: data.amountMl },
      update: { amountMl: data.amountMl },
    });
  }

  static async add(userId: string, date: Date, deltaMl: number) {
    const d = parseLocalDate(toLocalDateString(date));
    const existing = await db.waterLog.findUnique({
      where: { userId_date: { userId, date: d } },
    });
    const newAmount = Math.max(0, (existing?.amountMl ?? 0) + deltaMl);
    return db.waterLog.upsert({
      where: { userId_date: { userId, date: d } },
      create: { userId, date: d, amountMl: newAmount },
      update: { amountMl: newAmount },
    });
  }

  static async getDay(userId: string, dateStr: string) {
    const date = parseLocalDate(dateStr);
    const log = await db.waterLog.findUnique({
      where: { userId_date: { userId, date } },
    });
    return log?.amountMl ?? 0;
  }
}
