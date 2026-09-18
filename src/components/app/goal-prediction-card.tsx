"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type GoalPrediction } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, TrendingDown, Flag, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GoalPredictionCard — predicts when the user will reach their weight goal.
 * Uses linear regression on weight logs to project the timeline.
 */
export function GoalPredictionCard() {
  const { data: prediction, isLoading } = useQuery({
    queryKey: ["goal-prediction"],
    queryFn: () => api.get<GoalPrediction>("/api/prediction"),
  });

  if (isLoading || !prediction) {
    return (
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="h-4 w-4 text-emerald-500" /> Goal prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!prediction.goalWeightKg) {
    return (
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="h-4 w-4 text-emerald-500" /> Goal prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 py-6 text-center">
          <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">
            Set a weight goal in your profile to see predictions.
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLosing = prediction.goalType === "lose";
  const isGaining = prediction.goalType === "gain";
  const weightDiff = Math.round((prediction.goalWeightKg - prediction.currentWeightKg) * 10) / 10;
  const weeklyChangeColor =
    prediction.onTrack ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400";

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Target className="h-4 w-4 text-emerald-500" /> Goal prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{prediction.currentWeightKg.toFixed(1)}</div>
            <div className="text-[10px] text-muted-foreground">current kg</div>
          </div>
          <div className="text-muted-foreground text-lg">→</div>
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {prediction.goalWeightKg.toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground">goal kg</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className={cn("text-lg font-bold tabular-nums", weeklyChangeColor)}>
              {prediction.weeklyChangeKg > 0 ? "+" : ""}{prediction.weeklyChangeKg}
            </div>
            <div className="text-[10px] text-muted-foreground">kg/week</div>
          </div>
        </div>

        <div className={cn(
          "rounded-lg p-2.5 text-xs",
          prediction.onTrack
            ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-amber-700 dark:text-amber-400",
        )}>
          {prediction.message}
        </div>

        {prediction.daysToGoal !== null && prediction.daysToGoal > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Projected: {prediction.projectedDate} ({prediction.daysToGoal} days)
            <span className={cn(
              "ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-medium",
              prediction.confidence === "high"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : prediction.confidence === "medium"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-muted text-muted-foreground",
            )}>
              {prediction.confidence} confidence
            </span>
          </div>
        )}

        {prediction.onTrack && prediction.daysToGoal !== null && prediction.daysToGoal > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Flag className="h-3 w-3 text-emerald-500" />
            {isLosing ? "Losing" : isGaining ? "Gaining" : "Maintaining"} {Math.abs(weightDiff)}kg to go
          </div>
        )}
      </CardContent>
    </Card>
  );
}
