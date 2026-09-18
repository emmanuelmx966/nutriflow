import { db } from "@/lib/db";
import { fastStartSchema } from "@/lib/validators";

/**
 * FastingService — intermittent fasting session tracker.
 * Supports protocols 16:8, 18:6, 20:4, 24h, etc.
 */
export class FastingService {
  static async start(userId: string, input: unknown) {
    const { protocolHours } = fastStartSchema.parse(input);
    // cancel any active session first
    await db.fastSession.updateMany({
      where: { userId, status: "active" },
      data: { status: "cancelled", endTime: new Date() },
    });
    return db.fastSession.create({
      data: {
        userId,
        startTime: new Date(),
        protocolHours,
        status: "active",
      },
    });
  }

  static async stop(userId: string) {
    const active = await db.fastSession.findFirst({
      where: { userId, status: "active" },
      orderBy: { startTime: "desc" },
    });
    if (!active) return null;
    return db.fastSession.update({
      where: { id: active.id },
      data: { status: "completed", endTime: new Date() },
    });
  }

  static async current(userId: string) {
    return db.fastSession.findFirst({
      where: { userId, status: "active" },
      orderBy: { startTime: "desc" },
    });
  }

  static async history(userId: string, limit = 30) {
    return db.fastSession.findMany({
      where: { userId, status: "completed" },
      orderBy: { startTime: "desc" },
      take: limit,
    });
  }
}
