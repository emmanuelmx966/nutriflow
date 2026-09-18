import { db } from "@/lib/db";
import { goalSchema } from "@/lib/validators";

/**
 * GoalService — manage the user's active nutrition goals.
 */
export class GoalService {
  static async getActive(userId: string) {
    const goal = await db.goal.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
    });
    return goal;
  }

  static async upsert(userId: string, input: unknown) {
    const data = goalSchema.parse(input);
    // deactivate old, create new active
    await db.goal.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });
    return db.goal.create({
      data: { userId, ...data },
    });
  }

  static async history(userId: string) {
    return db.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }
}
