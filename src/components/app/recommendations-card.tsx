"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Recommendations, type DashboardData, type FoodRecommendation } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChefHat, Loader2, Plus, Target, Beef, Wheat, Droplet } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * RecommendationsCard — suggests recipes + foods to fill remaining macros.
 * Uses the user's recipes + catalog, scored by macro fit.
 */
export function RecommendationsCard({ data }: { data: DashboardData }) {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const qc = useQueryClient();

  // Only show if there's a meaningful remaining gap
  const remaining = data.remaining;
  const hasGap =
    remaining.calories > 100 ||
    remaining.protein > 10 ||
    remaining.carbs > 15 ||
    remaining.fat > 5;

  const { data: recs, isLoading } = useQuery({
    queryKey: ["recommendations", remaining.calories, remaining.protein, remaining.carbs, remaining.fat],
    queryFn: () =>
      api.get<Recommendations>(
        `/api/recommendations?remainingCal=${Math.round(remaining.calories)}&remainingProtein=${Math.round(remaining.protein)}&remainingCarbs=${Math.round(remaining.carbs)}&remainingFat=${Math.round(remaining.fat)}`,
      ),
    enabled: hasGap && !!data.goal,
  });

  const logRecipeMutation = useMutation({
    mutationFn: (recipeId: string) =>
      api.post(`/api/recipes/${recipeId}/log`, {
        meal: "lunch",
        date: selectedDate,
        servings: 1,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", selectedDate] });
      qc.invalidateQueries({ queryKey: ["dashboard", selectedDate] });
      toast.success("Recipe added to lunch");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to log"),
  });

  if (!hasGap || !data.goal) return null;

  const hasRecs = recs && (recs.recipes.length > 0 || recs.foods.length > 0);
  if (!isLoading && !hasRecs) return null;

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-violet-500" /> Suggested for you
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            {recs!.recipes.slice(0, 3).map((rec) => (
              <div
                key={rec.recipe.id}
                className="rounded-lg border border-violet-200/50 dark:border-violet-900/40 bg-violet-50/50 dark:bg-violet-950/20 p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <ChefHat className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                      <span className="text-xs font-semibold truncate">{rec.recipe.name}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {rec.recipe.calories} kcal · P{Math.round(rec.recipe.proteinG)} C{Math.round(rec.recipe.carbsG)} F{Math.round(rec.recipe.fatG)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-[8px] h-3.5 capitalize">
                        {rec.reason}
                      </Badge>
                      <span className="text-[8px] text-muted-foreground">
                        {rec.matchScore}% match
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 shrink-0 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                    onClick={() => logRecipeMutation.mutate(rec.recipe.id)}
                    disabled={logRecipeMutation.isPending}
                    aria-label="Add to lunch"
                  >
                    {logRecipeMutation.isPending && logRecipeMutation.variables === rec.recipe.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            {recs!.foods.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {recs!.foods[0].targetMacro === "protein" && "High-protein foods to fill your gap"}
                  {recs!.foods[0].targetMacro === "carbs" && "Carb-rich foods to fill your gap"}
                  {recs!.foods[0].targetMacro === "fat" && "Healthy fats to fill your gap"}
                  {recs!.foods[0].targetMacro === "calories" && "Low-calorie foods that fit"}
                </div>
                {recs!.foods.slice(0, 3).map((food) => (
                  <FoodSuggestionItem key={food.id} food={food} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const MACRO_ICONS: Record<string, typeof Beef> = {
  protein: Beef,
  carbs: Wheat,
  fat: Droplet,
  calories: Target,
};

const MACRO_COLORS: Record<string, string> = {
  protein: "text-rose-500",
  carbs: "text-amber-500",
  fat: "text-violet-500",
  calories: "text-sky-500",
};

function FoodSuggestionItem({ food }: { food: FoodRecommendation }) {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const qc = useQueryClient();
  const Icon = MACRO_ICONS[food.targetMacro] ?? Target;

  const logMutation = useMutation({
    mutationFn: () =>
      api.post("/api/diary", {
        date: new Date(selectedDate + "T12:00:00").toISOString(),
        meal: "snack",
        foodId: food.id,
        quantityG: food.suggestedPortionG,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", selectedDate] });
      qc.invalidateQueries({ queryKey: ["dashboard", selectedDate] });
      toast.success(`${food.name} added (${food.suggestedCalories} kcal)`);
    },
    onError: () => toast.error("Could not add food"),
  });

  return (
    <button
      onClick={() => logMutation.mutate()}
      disabled={logMutation.isPending}
      className="group flex w-full items-center justify-between gap-2 rounded-lg border border-border/40 bg-background hover:bg-accent/40 p-2 text-left transition-colors disabled:opacity-50"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-lg bg-accent/50 shrink-0", MACRO_COLORS[food.targetMacro])}>
          <Icon className="h-3 w-3" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">{food.name}</div>
          <div className="text-[10px] text-muted-foreground">
            {food.suggestedPortionG}g · {food.suggestedCalories} kcal · {food.suggestedProtein}g protein
          </div>
        </div>
      </div>
      <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-colors">
        {logMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
      </span>
    </button>
  );
}
