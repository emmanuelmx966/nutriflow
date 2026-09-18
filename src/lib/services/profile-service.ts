import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validators";
import { AuthService } from "./auth-service";

/**
 * ProfileService — update user biometric profile.
 * Triggers goal regeneration when profile data changes.
 */
export class ProfileService {
  static async update(userId: string, input: unknown) {
    const data = profileSchema.parse(input);
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.gender !== undefined) update.gender = data.gender;
    if (data.birthDate !== undefined) update.birthDate = new Date(data.birthDate);
    if (data.heightCm !== undefined) update.heightCm = data.heightCm;
    if (data.weightKg !== undefined) update.weightKg = data.weightKg;
    if (data.activityLevel !== undefined) update.activityLevel = data.activityLevel;
    if (data.goalType !== undefined) update.goalType = data.goalType;
    if (data.weeklyGoalKg !== undefined) update.weeklyGoalKg = data.weeklyGoalKg;

    const user = await db.user.update({
      where: { id: userId },
      data: update,
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
      },
    });

    // regenerate goals if profile is now complete
    await AuthService.regenerateGoals(userId);
    return user;
  }

  static async get(userId: string) {
    return db.user.findUnique({
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
  }
}
