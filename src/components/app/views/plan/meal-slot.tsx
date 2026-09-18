"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type MealPlanEntry, type Recipe } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MEAL_LABELS, type MealId } from "./constants";

export function MealSlot({
  day,
  dayIndex,
  meal,
  weekStart,
  entry,
}: {
  day: string;
  dayIndex: number;
  meal: MealId;
  weekStart: string;
  entry: MealPlanEntry | null;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [servings] = useState(1);

  const { data: recipes } = useQuery({
    queryKey: ["recipes", "mine"],
    queryFn: () => api.get<Recipe[]>("/api/recipes?scope=mine"),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: {
      recipeId?: string;
      customName?: string;
      servings: number;
    }) =>
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
    },
    onError: () => toast.error("No se pudo guardar la comida"),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      entry ? api.del(`/api/meal-plan?id=${entry.id}`) : Promise.resolve(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-plan", weekStart] });
      toast.success("Comida eliminada");
    },
    onError: () => toast.error("No se pudo eliminar"),
  });

  return (
    <div
      className={cn(
        "bg-background p-2 min-h-[68px] flex flex-col justify-between relative group",
        !entry && "hover:bg-accent/40 cursor-pointer transition-colors",
      )}
    >
      <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
        {meal.slice(0, 3)}
      </div>
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
            aria-label="Eliminar comida"
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
                {day} · {MEAL_LABELS[meal]}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {recipes && recipes.length > 0 ? (
                <>
                  <div className="text-xs font-medium text-muted-foreground">
                    Tus recetas
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto scroll-slim">
                    {recipes.map((r) => (
                      <button
                        key={r.id}
                        onClick={() =>
                          upsertMutation.mutate({ recipeId: r.id, servings: 1 })
                        }
                        className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">
                              {r.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {r.calories} kcal ·{" "}
                              {r.ingredients.length} ingredientes
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
                  Aún no tienes recetas. Créalas en la pestaña "Recetas" para
                  usarlas en tu plan.
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Comida personalizada
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="ej. Cena en restaurante"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!customName.trim() || upsertMutation.isPending}
                    onClick={() =>
                      upsertMutation.mutate({
                        customName: customName.trim(),
                        servings,
                      })
                    }
                  >
                    {upsertMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Añadir comida personalizada"
                    )}
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