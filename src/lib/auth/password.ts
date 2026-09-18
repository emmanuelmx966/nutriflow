import bcrypt from "bcryptjs";

/**
 * Password hashing service — Single Responsibility: secure password hashing.
 * Uses bcryptjs with a cost factor of 12 for strong resistance against brute force.
 */
const SALT_ROUNDS = 12;

export class PasswordHasher {
  static async hash(password: string): Promise<string> {
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    try {
      return bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
}
