"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type NutritionScore } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-600 dark:text-emerald-400",
  B: "text-lime-600 dark:text-lime-400",
  C: "text-amber-600 dark:text-amber-400",
  D: "text-orange-600 dark:text-orange-400",
  F: "text-rose-600 dark:text-rose-400",
};

const GRADE_BAR_COLORS: Record<string, string> = {
  A: "from-emerald-400 to-emerald-600",
  B: "from-lime-400 to-lime-600",
  C: "from-amber-400 to-amber-600",
  D: "from-orange-400 to-orange-600",
  F: "from-rose-400 to-rose-600",
};

/**
 * NutritionScoreCard — composite health score (0-100) with grade.
 * Combines macro adherence, food variety, consistency, hydration.
 */
export function NutritionScoreCard() {
  const { data: score, isLoading } = useQuery({
    queryKey: ["nutrition-score"],
    queryFn: () => api.get<NutritionScore>("/api/score"),
    staleTime: 60 * 1000, // cache for 1 min
  });

  if (isLoading || !score) {
    return (
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardContent className="p-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const trendIcon = score.trend > 0 ? TrendingUp : score.trend < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    score.trend > 0 ? "text-emerald-500" : score.trend < 0 ? "text-rose-500" : "text-muted-foreground";

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5 overflow-hidden">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" /> Nutrition score
          </span>
          <span className="flex items-center gap-0.5 text-xs font-normal">
            <span className={cn("flex items-center", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {score.trend > 0 ? `+${score.trend}` : score.trend}
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-4">
          {/* Score gauge */}
          <div className="relative h-20 w-20 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--muted)" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                className={cn("bg-gradient-to-r", GRADE_BAR_COLORS[score.grade])}
                stroke="var(--primary)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 32}
                strokeDashoffset={2 * Math.PI * 32 * (1 - score.todayScore / 100)}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-2xl font-bold leading-none", GRADE_COLORS[score.grade])}>
                {score.grade}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{score.todayScore}/100</span>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <p className="text-xs text-muted-foreground line-clamp-2">{score.message}</p>
            <div className="space-y-1">
              <ScoreComponent label="Macro adherence" value={score.components.macroAdherence} />
              <ScoreComponent label="Consistency" value={score.components.consistency} />
              <ScoreComponent label="Food variety" value={score.components.foodVariety} />
              <ScoreComponent label="Hydration" value={score.components.hydration} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreComponent({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : value > 0 ? "bg-rose-500" : "bg-muted-foreground/30";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </div>
      <span className="text-[10px] font-medium tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}
