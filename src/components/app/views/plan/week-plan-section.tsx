"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type MealPlanEntry, type Recipe } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { addDays, parseLocalDate } from "@/lib/utils/date";
import {
  DAYS,
  MEAL_IDS,
  getWeekStart,
  getWeekRange,
  type MealId,
} from "./constants";
import { MealSlot } from "./meal-slot";
import { GroceryListDialog } from "./grocery-list-dialog";
import { TemplatesDialog } from "./templates-dialog";

export function WeekPlanSection() {
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
    mutationFn: () =>
      api.post<{ autoPlanned: number }>("/api/meal-plan", {
        action: "auto-plan",
        week: weekStart,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", weekStart] });
      toast.success(`${data.autoPlanned} comidas planificadas`);
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Error al auto-planificar";
      toast.error(
        msg.includes("NO_RECIPES")
          ? "Primero crea algunas recetas"
          : msg,
      );
    },
  });

  const clearMutation = useMutation({
    mutationFn: () =>
      api.post<{ cleared: number }>("/api/meal-plan", {
        action: "clear",
        week: weekStart,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", weekStart] });
      toast.success(`${data.cleared} comidas eliminadas`);
    },
    onError: () => toast.error("No se pudo limpiar la semana"),
  });

  const navigateWeek = (delta: number) => {
    const newStart = getWeekStart(addDays(parseLocalDate(weekStart), delta * 7));
    setWeekStart(newStart);
  };

  const goThisWeek = () => setWeekStart(getWeekStart(new Date()));

  // Grid 7×4
  const planGrid: (MealPlanEntry | null)[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 4 }, () => null),
  );
  for (const entry of plan ?? []) {
    if (entry.dayIndex >= 0 && entry.dayIndex < 7) {
      const mealIdx = MEAL_IDS.indexOf(entry.meal as MealId);
      if (mealIdx >= 0) planGrid[entry.dayIndex][mealIdx] = entry;
    }
  }

  const dailyTotals = planGrid.map((day) =>
    day.reduce((sum, e) => sum + (e?.calories ?? 0), 0),
  );
  const weeklyTotal = dailyTotals.reduce((s, c) => s + c, 0);
  const plannedCount = (plan ?? []).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-emerald-500" /> Plan semanal
        </h2>
        <div className="flex items-center gap-2">
          <TemplatesDialog weekStart={weekStart} />
          <GroceryListDialog weekStart={weekStart} disabled={plannedCount === 0} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground -mt-2">
        Planifica tu semana. Asigna recetas a cada comida y genera tu lista de
        supermercado desde el plan.
      </p>

      {/* Navegación de semana */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold px-2">
            {getWeekRange(weekStart)}
          </span>
          <Button variant="ghost" size="sm" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goThisWeek}>
          Esta semana
        </Button>
      </div>

      {/* Barra de acciones */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => autoPlanMutation.mutate()}
          disabled={
            autoPlanMutation.isPending || (recipes?.length ?? 0) === 0
          }
        >
          {autoPlanMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4 mr-1" />
          )}
          Auto-planificar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-destructive hover:text-destructive"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending || plannedCount === 0}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Limpiar semana
        </Button>
      </div>

      {/* Resumen semanal */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardContent className="p-4 flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {plannedCount}
            </div>
            <div className="text-[10px] text-muted-foreground">
              comidas planificadas
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums">
              {Math.round(weeklyTotal)}
            </div>
            <div className="text-[10px] text-muted-foreground">kcal totales</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold tabular-nums">
              {plannedCount > 0 ? Math.round(weeklyTotal / plannedCount) : 0}
            </div>
            <div className="text-[10px] text-muted-foreground">prom / comida</div>
          </div>
        </CardContent>
      </Card>

      {/* Grid semanal */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {DAYS.map((day, dayIdx) => (
            <Card
              key={day}
              className="border-border/60 shadow-sm shadow-emerald-900/5 overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-3 py-2 bg-accent/40 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-9">{day}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {addDays(
                        parseLocalDate(weekStart),
                        dayIdx,
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {Math.round(dailyTotals[dayIdx])} kcal
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-px bg-border/30">
                  {MEAL_IDS.map((meal, mealIdx) => {
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

      {/* Estado vacío */}
      {plannedCount === 0 && !isLoading && (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <div className="text-sm font-medium">Sin comidas planificadas</div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Toca cualquier celda para asignar una receta, o usa
              "Auto-planificar" para llenar la semana con tus recetas guardadas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}