export { authOptions } from "./options";
export { PasswordHasher } from "./password";
export { authRateLimiter, apiRateLimiter, RateLimiter } from "@/lib/security/rate-limit";

import { getServerSession, type Session } from "next-auth";
import { authOptions } from "./options";
import { db } from "@/lib/db";

export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user.id;
}

export async function getCurrentUserProfile() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return db.user.findUnique({
    where: { id: session.user.id },
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
}
