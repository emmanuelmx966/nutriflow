import { db } from "@/lib/db";
import { toLocalDateString, parseLocalDate } from "@/lib/utils/date";

/**
 * LeaderboardService — community nutrition score comparison.
 * Single Responsibility: rank users by their latest score.
 */

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  score: number;
  grade: string;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  totalUsers: number;
}

export class LeaderboardService {
  /**
   * Get top users by their most recent nutrition score.
   * Only includes users who have at least one score history entry.
   */
  static async getLeaderboard(userId: string, limit = 10): Promise<LeaderboardData> {
    // Get the latest score for each user (using distinct + orderBy)
    const allScores = await db.scoreHistory.findMany({
      where: {},
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    // Deduplicate by userId (keep most recent)
    const seen = new Set<string>();
    const latest = allScores.filter((s) => {
      if (seen.has(s.userId)) return false;
      seen.add(s.userId);
      return true;
    });

    // Sort by score desc
    latest.sort((a, b) => b.score - a.score);

    const entries: LeaderboardEntry[] = latest.slice(0, limit).map((s, idx) => ({
      rank: idx + 1,
      userId: s.userId,
      userName: s.user?.name ?? "Anonymous",
      score: s.score,
      grade: s.grade,
      isCurrentUser: s.userId === userId,
    }));

    // Find current user's rank
    const currentUserIndex = latest.findIndex((s) => s.userId === userId);
    const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null;

    return {
      entries,
      currentUserRank,
      totalUsers: latest.length,
    };
  }
}
