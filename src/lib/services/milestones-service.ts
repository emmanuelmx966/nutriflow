import { db } from "@/lib/db";
import { toLocalDateString, addDays, parseLocalDate } from "@/lib/utils/date";

/**
 * MilestonesService — score-based milestones + badges (gamification layer 2).
 * Single Responsibility: compute unlocked milestones from score history + logs.
 */

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  unlockedDate?: string;
}

export interface MilestonesData {
  milestones: Milestone[];
  unlockedCount: number;
  totalCount: number;
  nextMilestone?: Milestone;
}

const MILESTONE_DEFS: Array<{
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  type: "score_streak" | "score_threshold" | "logging_streak" | "perfect_day" | "consistency";
}> = [
  { id: "first_score", title: "First Score", description: "Generate your first nutrition score", icon: "🎯", target: 1, type: "score_threshold" },
  { id: "score_50", title: "Getting Started", description: "Reach a score of 50", icon: "🌱", target: 50, type: "score_threshold" },
  { id: "score_70", title: "Healthy Habits", description: "Reach a score of 70", icon: "💚", target: 70, type: "score_threshold" },
  { id: "score_80", title: "Nutrition Pro", description: "Reach a score of 80", icon: "🌟", target: 80, type: "score_threshold" },
  { id: "score_90", title: "Nutrition Champion", description: "Reach a score of 90", icon: "🏆", target: 90, type: "score_threshold" },
  { id: "score_100", title: "Perfectionist", description: "Achieve a perfect score of 100", icon: "💯", target: 100, type: "score_threshold" },
  { id: "streak_3_above_70", title: "On Fire", description: "3-day streak with score above 70", icon: "🔥", target: 3, type: "score_streak" },
  { id: "streak_7_above_70", title: "Week Warrior", description: "7-day streak with score above 70", icon: "⚡", target: 7, type: "score_streak" },
  { id: "streak_30_above_70", title: "Monthly Master", description: "30-day streak with score above 70", icon: "👑", target: 30, type: "score_streak" },
  { id: "perfect_day", title: "Perfect Day", description: "Hit all 4 components at 100% in one day", icon: "✨", target: 1, type: "perfect_day" },
  { id: "log_streak_7", title: "Consistent Logger", description: "Log food 7 days in a row", icon: "📅", target: 7, type: "logging_streak" },
  { id: "log_streak_30", title: "Habit Builder", description: "Log food 30 days in a row", icon: "🗓️", target: 30, type: "logging_streak" },
];

export class MilestonesService {
  static async getMilestones(userId: string): Promise<MilestonesData> {
    const [history, foodLogDates] = await Promise.all([
      db.scoreHistory.findMany({
        where: { userId },
        orderBy: { date: "asc" },
      }),
      db.foodLog.findMany({
        where: { userId },
        select: { date: true },
        distinct: ["date"],
        orderBy: { date: "asc" },
      }),
    ]);

    const scores = history.map((h) => h.score);
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const hasScore = history.length > 0;

    // Compute score streak above 70 (consecutive days ending today or yesterday)
    const scoreStreak = this.computeScoreStreak(history.map((h) => ({ date: toLocalDateString(h.date), score: h.score })));
    // Compute perfect days
    const perfectDays = history.filter((h) =>
      h.macroAdherence >= 100 && h.foodVariety >= 100 && h.consistency >= 100 && h.hydration >= 100
    ).length;
    // Compute logging streak (consecutive days with food logs ending today or yesterday)
    const logStreak = this.computeLogStreak(foodLogDates.map((d) => toLocalDateString(d.date)));

    const milestones: Milestone[] = MILESTONE_DEFS.map((def) => {
      let unlocked = false;
      let progress = 0;
      let unlockedDate: string | undefined;

      switch (def.type) {
        case "score_threshold":
          progress = Math.min(maxScore, def.target);
          unlocked = maxScore >= def.target;
          if (unlocked) {
            const entry = history.find((h) => h.score >= def.target);
            if (entry) unlockedDate = toLocalDateString(entry.date);
          }
          if (def.id === "first_score") {
            progress = hasScore ? 1 : 0;
            unlocked = hasScore;
            if (unlocked && history[0]) unlockedDate = toLocalDateString(history[0].date);
          }
          break;
        case "score_streak":
          progress = Math.min(scoreStreak, def.target);
          unlocked = scoreStreak >= def.target;
          break;
        case "perfect_day":
          progress = perfectDays;
          unlocked = perfectDays >= def.target;
          break;
        case "logging_streak":
          progress = Math.min(logStreak, def.target);
          unlocked = logStreak >= def.target;
          break;
      }

      return {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        unlocked,
        progress,
        target: def.target,
        unlockedDate,
      };
    });

    const unlockedCount = milestones.filter((m) => m.unlocked).length;
    const nextMilestone = milestones.find((m) => !m.unlocked);

    return {
      milestones,
      unlockedCount,
      totalCount: milestones.length,
      nextMilestone,
    };
  }

  /**
   * Compute current streak of consecutive days with score >= 70 (ending today/yesterday).
   */
  private static computeScoreStreak(entries: Array<{ date: string; score: number }>): number {
    if (entries.length === 0) return 0;
    const sorted = entries.sort((a, b) => b.date.localeCompare(a.date));
    const today = toLocalDateString(new Date());
    const yesterday = toLocalDateString(addDays(new Date(), -1));

    let streak = 0;
    let cursor = sorted[0]?.date === today || sorted[0]?.date === yesterday ? sorted[0].date : null;
    if (!cursor) return 0;

    const byDate = new Map(sorted.map((e) => [e.date, e.score]));
    while (cursor) {
      const score = byDate.get(cursor);
      if (score === undefined || score < 70) break;
      streak++;
      cursor = toLocalDateString(addDays(parseLocalDate(cursor), -1));
    }
    return streak;
  }

  /**
   * Compute current streak of consecutive days with food logs (ending today/yesterday).
   */
  private static computeLogStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    const sorted = dates.sort((a, b) => b.localeCompare(a));
    const today = toLocalDateString(new Date());
    const yesterday = toLocalDateString(addDays(new Date(), -1));

    let streak = 0;
    let cursor = sorted[0] === today || sorted[0] === yesterday ? sorted[0] : null;
    if (!cursor) return 0;

    const set = new Set(dates);
    while (cursor && set.has(cursor)) {
      streak++;
      cursor = toLocalDateString(addDays(parseLocalDate(cursor), -1));
    }
    return streak;
  }
}
