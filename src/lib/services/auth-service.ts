import { db } from "@/lib/db";
import { PasswordHasher } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validators";
import { estimateGoals } from "@/lib/nutrition/calculator";
import { calcAge } from "@/lib/nutrition/calculator";

/**
 * AuthService — registration + onboarding.
 * Single Responsibility: user account creation.
 */
export class AuthService {
  static async register(input: unknown) {
    const parsed = registerSchema.parse(input);
    const { name, email, password } = parsed;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("EMAIL_TAKEN");
    }

    const passwordHash = await PasswordHasher.hash(password);
    const user = await db.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true },
    });
    return user;
  }

  /**
   * Auto-generate default goals once the user completes their profile.
   */
  static async regenerateGoals(userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const hasProfile =
      user.gender &&
      user.birthDate &&
      user.heightCm &&
      user.weightKg &&
      user.activityLevel &&
      user.goalType;
    if (!hasProfile) return;

    const est = estimateGoals({
      gender: user.gender as "male" | "female",
      weightKg: user.weightKg!,
      heightCm: user.heightCm!,
      ageYears: calcAge(user.birthDate!),
      activity: user.activityLevel as never,
      goal: user.goalType as "lose" | "maintain" | "gain",
      weeklyGoalKg: user.weeklyGoalKg ?? 0.5,
    });

    // Deactivate old goals, create new active goal
    await db.goal.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });
    await db.goal.create({
      data: {
        userId,
        calorieGoal: est.calorieGoal,
        proteinGoalG: est.proteinG,
        carbGoalG: est.carbG,
        fatGoalG: est.fatG,
        waterGoalMl: est.waterGoalMl,
        weightGoalKg: user.weightKg,
        active: true,
      },
    });
  }
}
