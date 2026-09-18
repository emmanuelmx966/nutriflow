"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type LeaderboardData } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Crown, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-600 dark:text-emerald-400",
  B: "text-lime-600 dark:text-lime-400",
  C: "text-amber-600 dark:text-amber-400",
  D: "text-orange-600 dark:text-orange-400",
  F: "text-rose-600 dark:text-rose-400",
};

const RANK_ICONS: Record<number, typeof Crown> = {
  1: Crown,
  2: Medal,
  3: Award,
};

/**
 * LeaderboardCard — community nutrition score ranking.
 * Shows top 10 users by latest score + current user's rank.
 */
export function LeaderboardCard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api.get<LeaderboardData>("/api/leaderboard"),
  });

  if (isLoading || !leaderboard) {
    return (
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.entries.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 py-8 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <div className="text-sm font-medium">No scores yet</div>
          <p className="text-xs text-muted-foreground mt-1">
            Visit your dashboard to generate your first nutrition score and join the leaderboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
          </span>
          <span className="text-[10px] font-normal text-muted-foreground">
            {leaderboard.totalUsers} {leaderboard.totalUsers === 1 ? "user" : "users"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-1">
        {leaderboard.entries.map((entry) => {
          const RankIcon = RANK_ICONS[entry.rank] ?? null;
          return (
            <div
              key={entry.userId}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                entry.isCurrentUser
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40"
                  : "hover:bg-accent/40",
              )}
            >
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
                entry.rank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                : entry.rank === 2 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                : entry.rank === 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                : "bg-muted text-muted-foreground",
              )}>
                {RankIcon ? <RankIcon className="h-3 w-3" /> : entry.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                  {entry.userName ?? "Anonymous"}
                  {entry.isCurrentUser && (
                    <span className="ml-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">(you)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn("text-sm font-bold tabular-nums", GRADE_COLORS[entry.grade] ?? "")}>
                  {entry.score}
                </span>
                <span className={cn("text-xs font-bold", GRADE_COLORS[entry.grade] ?? "")}>
                  {entry.grade}
                </span>
              </div>
            </div>
          );
        })}
        {leaderboard.currentUserRank && leaderboard.currentUserRank > 10 && (
          <div className="pt-1 text-center text-[10px] text-muted-foreground">
            Your rank: #{leaderboard.currentUserRank} of {leaderboard.totalUsers}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
