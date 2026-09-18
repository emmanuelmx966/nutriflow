"use client";

import type { DashboardData, DiaryDay } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Sun, Moon, Cookie } from "lucide-react";
import { PerMealTargetsService, type PerMealTarget } from "@/lib/services/per-meal-targets-service";
import { cn } from "@/lib/utils";

const MEAL_ICONS: Record<string, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

/**
 * PerMealTargetsCard — shows per-meal calorie distribution + progress.
 * Helps users pace their intake across the day (30/40/25/5 split).
 */
export function PerMealTargetsCard({
  data,
  diaryDay,
}: {
  data: DashboardData;
  diaryDay?: DiaryDay;
}) {
  if (!data.goal) return null;

  const targets = PerMealTargetsService.compute({
    calorieGoal: data.goal.calorieGoal,
    proteinGoalG: data.goal.proteinGoalG,
    carbGoalG: data.goal.carbGoalG,
    fatGoalG: data.goal.fatGoalG,
  });

  // Group consumed by meal
  const consumedByMeal: Record<string, { calories: number }> = {
    breakfast: { calories: 0 },
    lunch: { calories: 0 },
    dinner: { calories: 0 },
    snack: { calories: 0 },
  };
  for (const log of diaryDay?.logs ?? []) {
    const meal = log.meal in consumedByMeal ? log.meal : "snack";
    consumedByMeal[meal].calories += log.calories;
  }

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>Meal distribution</span>
          <span className="text-[10px] font-normal text-muted-foreground">target split 30/40/25/5</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        {targets.map((target) => {
          const Icon = MEAL_ICONS[target.meal] ?? Coffee;
          const consumed = consumedByMeal[target.meal]?.calories ?? 0;
          const pct = target.calorieTarget > 0 ? Math.min(100, (consumed / target.calorieTarget) * 100) : 0;
          const over = consumed > target.calorieTarget;
          return (
            <div key={target.meal} className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 w-20 shrink-0">
                <Icon className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium capitalize">{target.meal}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      over
                        ? "bg-orange-500"
                        : "bg-emerald-progress",
                    )}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0 w-16">
                <span className={cn(
                  "text-xs font-semibold tabular-nums",
                  over ? "text-orange-600 dark:text-orange-400" : "text-foreground",
                )}>
                  {Math.round(consumed)}
                </span>
                <span className="text-[10px] text-muted-foreground">/{target.calorieTarget}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
