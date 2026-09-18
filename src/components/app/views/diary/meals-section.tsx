"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type DiaryDay } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Coffee, Sun, Moon, Cookie } from "lucide-react";
import { toast } from "sonner";
import { FoodAutocomplete } from "@/components/app/food-autocomplete";
import { BarcodeScanner } from "@/components/app/barcode-scanner";
import { FoodSearchDialog } from "./food-search-dialog";
import { CustomFoodCreator } from "./custom-food-creator";
import { MEAL_IDS, MEAL_LABELS, type MealId } from "./constants";

const MEAL_ICONS: Record<MealId, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

export function MealsSection({ date }: { date: string }) {
  const qc = useQueryClient();

  const { data: day, isLoading } = useQuery({
    queryKey: ["diary", date],
    queryFn: () => api.get<DiaryDay>(`/api/diary?date=${date}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/diary/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", date] });
      qc.invalidateQueries({ queryKey: ["dashboard", date] });
      toast.success("Eliminado del diario");
    },
    onError: () => toast.error("No se pudo eliminar"),
  });

  if (isLoading) return <MealsSkeleton />;

  const logs = day?.logs ?? [];
  const totals =
    day?.consumed ?? {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };

  return (
    <div className="space-y-4">
      {/* Banner de totales del día */}
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0">
        <CardContent className="p-4 flex items-center justify-around text-center">
          <div>
            <div className="text-2xl font-bold tabular-nums">
              {Math.round(totals.calories)}
            </div>
            <div className="text-[11px] text-emerald-50/90">kcal</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <div className="text-lg font-semibold tabular-nums">
              {Math.round(totals.protein)}
            </div>
            <div className="text-[11px] text-emerald-50/90">proteína g</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <div className="text-lg font-semibold tabular-nums">
              {Math.round(totals.carbs)}
            </div>
            <div className="text-[11px] text-emerald-50/90">carbos g</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <div className="text-lg font-semibold tabular-nums">
              {Math.round(totals.fat)}
            </div>
            <div className="text-[11px] text-emerald-50/90">grasa g</div>
          </div>
        </CardContent>
      </Card>

      {/* Búsqueda rápida */}
      <FoodAutocomplete meal="snack" date={date} />

      {/* Secciones de comida */}
      {MEAL_IDS.map((mealId) => {
        const mealLogs = logs.filter((l) => l.meal === mealId);
        const mealCals = mealLogs.reduce((s, l) => s + l.calories, 0);
        const Icon = MEAL_ICONS[mealId];
        return (
          <Card key={mealId} className="border-border/60">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                    <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">
                      {MEAL_LABELS[mealId]}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {Math.round(mealCals)} kcal
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <BarcodeScanner meal={mealId} date={date} />
                  <FoodSearchDialog meal={mealId} date={date} />
                </div>
              </div>
              {mealLogs.length > 0 ? (
                <ul className="divide-y divide-border/40">
                  {mealLogs.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {l.foodName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {Math.round(l.quantityG)}g ·{" "}
                          {l.servings.toFixed(1)} porción
                          {l.servings === 1 ? "" : "es"} · P
                          {Math.round(l.protein)} C{Math.round(l.carbs)} G
                          {Math.round(l.fat)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {Math.round(l.calories)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate(l.id)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-3 text-xs text-muted-foreground">
                  Sin alimentos registrados
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Crear alimento personalizado */}
      <CustomFoodCreator onCreated={() => toast.success("Alimento creado")} />
    </div>
  );
}

function MealsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-xl" />
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}