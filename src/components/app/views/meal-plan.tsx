"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type MealPlanEntry, type GroceryList, type Recipe, type MealPlanTemplate } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Plus, Trash2, Sparkles, ShoppingCart, ChevronLeft, ChevronRight, X, Loader2, Wand2, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addDays, toLocalDateString, parseLocalDate } from "@/lib/utils/date";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
type Meal = (typeof MEALS)[number];

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalDateString(d);
}

function getWeekRange(weekStart: string): string {
  const start = parseLocalDate(weekStart);
  const end = addDays(start, 6);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export function MealPlanView() {
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const { data: plan, isLoading } = useQuery({
    queryKey: ["meal-plan", weekStart],
    queryFn: () => api.get<MealPlanEntry[]>(`/api/meal-plan?week=${weekStart}`),
  });

  const { data: recipes } = useQuery({
    queryKey: ["recipes", "mine"],
    queryFn: () => api.get<Recipe[]>("/api/recipes?scope=mine"),
  });

  const autoPlanMutation = useMutation({
    mutationFn: () => api.post("/api/meal-plan", { action: "auto-plan", week: weekStart }),
    onSuccess: (data: { autoPlanned: number }) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", weekStart] });
      toast.success(`Auto-planned ${data.autoPlanned} meals`);
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Auto-plan failed";
      toast.error(msg.includes("NO_RECIPES") ? "Create some recipes first" : msg);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => api.post("/api/meal-plan", { action: "clear", week: weekStart }),
    onSuccess: (data: { cleared: number }) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", weekStart] });
      toast.success(`Cleared ${data.cleared} meals`);
    },
    onError: () => toast.error("Could not clear week"),
  });

  const navigateWeek = (delta: number) => {
    const newStart = getWeekStart(addDays(parseLocalDate(weekStart), delta * 7));
    setWeekStart(newStart);
  };

  const goThisWeek = () => setWeekStart(getWeekStart(new Date()));

  // Build a 7x4 grid
  const planGrid: (MealPlanEntry | null)[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 4 }, () => null),
  );
  for (const entry of plan ?? []) {
    if (entry.dayIndex >= 0 && entry.dayIndex < 7) {
      const mealIdx = MEALS.indexOf(entry.meal as Meal);
      if (mealIdx >= 0) planGrid[entry.dayIndex][mealIdx] = entry;
    }
  }

  // Daily totals
  const dailyTotals = planGrid.map((day) =>
    day.reduce((sum, e) => sum + (e?.calories ?? 0), 0),
  );
  const weeklyTotal = dailyTotals.reduce((s, c) => s + c, 0);
  const plannedCount = (plan ?? []).length;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-emerald-500" /> Meal Plan
        </h2>
        <div className="flex items-center gap-2">
          <TemplatesDialog weekStart={weekStart} />
          <GroceryListDialog weekStart={weekStart} disabled={plannedCount === 0} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground -mt-2">
        Plan your week ahead. Assign recipes to meal slots, then generate a grocery list from your plan.
      </p>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold px-2">{getWeekRange(weekStart)}</span>
          <Button variant="ghost" size="sm" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goThisWeek}>
          This week
        </Button>
      </div>

      {/* Action bar */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => autoPlanMutation.mutate()}
          disabled={autoPlanMutation.isPending || (recipes?.length ?? 0) === 0}
        >
          {autoPlanMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4 mr-1" />
          )}
          Auto-plan
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-destructive hover:text-destructive"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending || plannedCount === 0}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Clear week
        </Button>
      </div>

      {/* Weekly summary */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardContent className="p-4 flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {plannedCount}
            </div>
            <div className="text-[10px] text-muted-foreground">meals planned</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums">{Math.round(weeklyTotal)}</div>
            <div className="text-[10px] text-muted-foreground">total kcal</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums">
              {plannedCount > 0 ? Math.round(weeklyTotal / plannedCount) : 0}
            </div>
            <div className="text-[10px] text-muted-foreground">avg / meal</div>
          </div>
        </CardContent>
      </Card>

      {/* Week grid */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {DAYS.map((day, dayIdx) => (
            <Card key={day} className="border-border/60 shadow-sm shadow-emerald-900/5 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-3 py-2 bg-accent/40 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-9">{day}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {addDays(parseLocalDate(weekStart), dayIdx).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {Math.round(dailyTotals[dayIdx])} kcal
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-px bg-border/30">
                  {MEALS.map((meal, mealIdx) => {
                    const entry = planGrid[dayIdx][mealIdx];
                    return (
                      <MealSlot
                        key={meal}
                        day={day}
                        dayIndex={dayIdx}
                        meal={meal}
                        weekStart={weekStart}
                        entry={entry}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state hint */}
      {plannedCount === 0 && !isLoading && (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <div className="text-sm font-medium">No meals planned yet</div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Tap any meal slot to assign a recipe, or use "Auto-plan" to fill the week with your saved recipes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MealSlot({
  day,
  dayIndex,
  meal,
  weekStart,
  entry,
}: {
  day: string;
  dayIndex: number;
  meal: Meal;
  weekStart: string;
  entry: MealPlanEntry | null;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [servings, setServings] = useState(1);

  const { data: recipes } = useQuery({
    queryKey: ["recipes", "mine"],
    queryFn: () => api.get<Recipe[]>("/api/recipes?scope=mine"),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: { recipeId?: string; customName?: string; servings: number }) =>
      api.post("/api/meal-plan", {
        weekStartDate: weekStart,
        dayIndex,
        meal,
        ...data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-plan", weekStart] });
      setOpen(false);
      setCustomName("");
      setServings(1);
    },
    onError: () => toast.error("Could not save meal"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => (entry ? api.del(`/api/meal-plan?id=${entry.id}`) : Promise.resolve()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-plan", weekStart] });
      toast.success("Meal removed");
    },
    onError: () => toast.error("Could not remove"),
  });

  return (
    <div
      className={cn(
        "bg-background p-2 min-h-[68px] flex flex-col justify-between relative group",
        !entry && "hover:bg-accent/40 cursor-pointer transition-colors",
      )}
    >
      <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">{meal.slice(0, 3)}</div>
      {entry ? (
        <div className="mt-0.5">
          <div className="text-[11px] font-medium leading-tight line-clamp-2">
            {entry.recipeName ?? entry.customName}
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            {Math.round(entry.calories)} kcal
          </div>
          <button
            onClick={() => deleteMutation.mutate()}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            aria-label="Remove meal"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center justify-center h-full -mt-2">
              <Plus className="h-4 w-4 text-muted-foreground/40" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto scroll-slim">
            <DialogHeader>
              <DialogTitle className="text-base">
                {day} {meal}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {recipes && recipes.length > 0 ? (
                <>
                  <div className="text-xs font-medium text-muted-foreground">From your recipes</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto scroll-slim">
                    {recipes.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => upsertMutation.mutate({ recipeId: r.id, servings: 1 })}
                        className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{r.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {r.calories} kcal · {r.ingredients.length} ingredients
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-emerald-500 shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-accent/40 p-3 text-center text-xs text-muted-foreground">
                  No recipes yet. Create recipes in the Recipes tab to use them in your meal plan.
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground mb-2">Custom meal</div>
                <div className="space-y-2">
                  <Input
                    placeholder="e.g. Restaurant dinner"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!customName.trim() || upsertMutation.isPending}
                    onClick={() => upsertMutation.mutate({ customName: customName.trim(), servings })}
                  >
                    {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add custom meal"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function GroceryListDialog({ weekStart, disabled }: { weekStart: string; disabled: boolean }) {
  const { data: grocery, isLoading } = useQuery({
    queryKey: ["grocery-list", weekStart],
    queryFn: () => api.get<GroceryList>(`/api/meal-plan/grocery?week=${weekStart}`),
    enabled: !disabled,
  });

  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(name: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <Dialog onOpenChange={() => setChecked(new Set())}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <ShoppingCart className="h-4 w-4 mr-1" /> Grocery list
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-emerald-500" /> Grocery list
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : grocery && grocery.items.length > 0 ? (
          <>
            <div className="rounded-lg bg-accent/40 p-3 flex items-center justify-around text-center">
              <div>
                <div className="text-lg font-bold tabular-nums">{grocery.totalItems}</div>
                <div className="text-[10px] text-muted-foreground">items</div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div>
                <div className="text-lg font-bold tabular-nums">{Math.round(grocery.totalCalories)}</div>
                <div className="text-[10px] text-muted-foreground">total kcal</div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div>
                <div className="text-lg font-bold tabular-nums">{checked.size}</div>
                <div className="text-[10px] text-muted-foreground">checked</div>
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto scroll-slim space-y-1 -mx-1 px-1">
              {grocery.items.map((item) => {
                const isChecked = checked.has(item.name);
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => toggle(item.name)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors text-left",
                        isChecked ? "bg-emerald-50 dark:bg-emerald-950/30 opacity-60" : "hover:bg-accent",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={cn(
                            "h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                            isChecked ? "bg-emerald-500 border-emerald-500" : "border-border",
                          )}
                        >
                          {isChecked && (
                            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none">
                              <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className={cn("text-sm font-medium truncate", isChecked && "line-through")}>
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {item.totalGrams}g
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="py-8 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <div className="text-sm font-medium">No ingredients to shop for</div>
            <p className="text-xs text-muted-foreground mt-1">
              Plan some meals with recipes to generate a grocery list.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TemplatesDialog({ weekStart }: { weekStart: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ["meal-plan-templates"],
    queryFn: () => api.get<MealPlanTemplate[]>("/api/meal-plan/templates"),
  });

  const applyMutation = useMutation({
    mutationFn: (templateId: string) =>
      api.post<{ planned: number }>("/api/meal-plan/templates", { templateId, week: weekStart }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", weekStart] });
      toast.success(`Template applied: ${data.planned} meals planned`);
      setOpen(false);
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Failed";
      toast.error(msg.includes("NO_RECIPES") ? "Create or like some recipes first" : msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <LayoutTemplate className="h-4 w-4 mr-1" /> Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto scroll-slim">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-emerald-500" /> Plan templates
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Pre-built weekly templates using your saved + community recipes. Applied meals fill empty slots without overwriting existing plans.
          </p>
          {(templates ?? []).map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyMutation.mutate(tpl.id)}
              disabled={applyMutation.isPending}
              className="group w-full text-left rounded-xl border border-border/60 p-3 hover:border-emerald-400 hover:bg-accent/40 transition-all"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-2xl shrink-0">{tpl.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{tpl.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{tpl.targetCalories}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{tpl.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {tpl.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[8px] h-4 capitalize">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {!templates && (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
