"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Recipe } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChefHat, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { LogRecipeDialog } from "./log-recipe-dialog";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/api/recipes/${recipe.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Receta eliminada");
    },
    onError: () => toast.error("No se pudo eliminar la receta"),
  });

  return (
    <Card className="border-border/60 overflow-hidden transition-shadow hover:shadow-md hover:shadow-emerald-900/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate">{recipe.name}</h3>
            {recipe.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {recipe.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {recipe.calories} kcal
              </span>
              <span className="text-muted-foreground">
                P{Math.round(recipe.proteinG)}g
              </span>
              <span className="text-muted-foreground">
                C{Math.round(recipe.carbsG)}g
              </span>
              <span className="text-muted-foreground">
                G{Math.round(recipe.fatG)}g
              </span>
              <span className="text-muted-foreground">
                · {recipe.servings} porc
              </span>
              <span className="text-muted-foreground">
                · {recipe.ingredients.length} ingredientes
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Button size="sm" className="h-7 text-xs" onClick={() => setLogOpen(true)}>
              Registrar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setOpen(true)}
            >
              Ver
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Detalle de la receta */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto scroll-slim">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-emerald-500" /> {recipe.name}
            </DialogTitle>
          </DialogHeader>
          {recipe.description && (
            <p className="text-sm text-muted-foreground">
              {recipe.description}
            </p>
          )}
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-accent/40 p-3 text-center">
            <div>
              <div className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {recipe.calories}
              </div>
              <div className="text-[10px] text-muted-foreground">kcal</div>
            </div>
            <div>
              <div className="text-lg font-bold tabular-nums">
                {Math.round(recipe.proteinG)}g
              </div>
              <div className="text-[10px] text-muted-foreground">proteína</div>
            </div>
            <div>
              <div className="text-lg font-bold tabular-nums">
                {Math.round(recipe.carbsG)}g
              </div>
              <div className="text-[10px] text-muted-foreground">carbos</div>
            </div>
            <div>
              <div className="text-lg font-bold tabular-nums">
                {Math.round(recipe.fatG)}g
              </div>
              <div className="text-[10px] text-muted-foreground">grasa</div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground text-center">
            por porción · {recipe.servings} porciones totales
          </div>
          <div className="pt-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Ingredientes
            </div>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex items-center justify-between rounded-lg bg-accent/30 px-3 py-1.5 text-xs"
                >
                  <span className="font-medium">{ing.name}</span>
                  <span className="text-muted-foreground">
                    {Math.round(ing.quantityG)}g · {Math.round(ing.calories)}{" "}
                    kcal
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLogOpen(true)}
            >
              Registrar en diario
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                deleteMutation.mutate();
                setOpen(false);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrar en diario */}
      <LogRecipeDialog
        recipe={recipe}
        open={logOpen}
        onOpenChange={setLogOpen}
        date={selectedDate}
      />
    </Card>
  );
}