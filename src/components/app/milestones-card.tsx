"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type MilestonesData } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MilestonesCard — score-based milestones + badges (gamification layer 2).
 * Shows progress towards score thresholds, streaks, perfect days, logging consistency.
 */
export function MilestonesCard() {
  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ["milestones"],
    queryFn: () => api.get<MilestonesData>("/api/milestones"),
  });

  if (isLoading || !milestonesData) {
    return (
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" /> Milestones
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { milestones, unlockedCount, totalCount, nextMilestone } = milestonesData;

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" /> Milestones
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {unlockedCount}/{totalCount} unlocked
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-2">
        {nextMilestone && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 p-2.5 mb-2">
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-1">NEXT GOAL</div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{nextMilestone.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold">{nextMilestone.title}</div>
                <div className="text-[10px] text-muted-foreground">{nextMilestone.description}</div>
              </div>
            </div>
            <div className="mt-1.5 h-1 w-full rounded-full bg-amber-200/50 dark:bg-amber-900/40 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (nextMilestone.progress / nextMilestone.target) * 100)}%` }}
              />
            </div>
            <div className="text-[9px] text-muted-foreground text-right mt-0.5">
              {nextMilestone.progress}/{nextMilestone.target}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          {milestones.map((m) => {
            const pct = m.target > 0 ? Math.min(100, (m.progress / m.target) * 100) : 0;
            return (
              <div
                key={m.id}
                className={cn(
                  "relative rounded-lg border p-2 transition-all",
                  m.unlocked
                    ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40"
                    : "border-border/40 bg-muted/20 opacity-70",
                )}
              >
                <div className="flex items-start gap-1.5">
                  <span className={cn("text-lg shrink-0", !m.unlocked && "grayscale opacity-40")}>
                    {m.unlocked ? m.icon : "🔒"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold leading-tight">{m.title}</div>
                    <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{m.description}</div>
                  </div>
                  {m.unlocked && (
                    <CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                </div>
                {!m.unlocked && m.progress > 0 && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[8px] text-muted-foreground text-right mt-0.5">
                      {m.progress}/{m.target}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
