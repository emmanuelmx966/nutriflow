"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Recipe } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MEAL_IDS, MEAL_LABELS, type MealId } from "./constants";

export function LogRecipeDialog({
  recipe,
  open,
  onOpenChange,
  date,
}: {
  recipe: Recipe;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: string;
}) {
  const [meal, setMeal] = useState<MealId>("lunch");
  const [servings, setServings] = useState(1);
  const qc = useQueryClient();

  const logMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/recipes/${recipe.id}/log`, { meal, date, servings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", date] });
      qc.invalidateQueries({ queryKey: ["dashboard", date] });
      toast.success(`${recipe.name} añadido a ${MEAL_LABELS[meal]}`);
      onOpenChange(false);
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Error al registrar"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar receta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg bg-accent/40 p-3 text-center">
            <div className="text-xs text-muted-foreground">{recipe.name}</div>
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {Math.round(recipe.calories * servings)}{" "}
              <span className="text-xs font-normal">kcal</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {servings} × {recipe.calories} kcal/porción
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Comida</Label>
            <Select value={meal} onValueChange={(v) => setMeal(v as MealId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_IDS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {MEAL_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Porciones</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() =>
                  setServings(
                    Math.max(0.25, Math.round((servings - 0.25) * 100) / 100),
                  )
                }
              >
                <span className="text-lg leading-none">−</span>
              </Button>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                value={servings}
                onChange={(e) =>
                  setServings(
                    Math.max(0.25, parseFloat(e.target.value) || 0.25),
                  )
                }
                className="text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() =>
                  setServings(Math.round((servings + 0.25) * 100) / 100)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => logMutation.mutate()}
            disabled={logMutation.isPending}
            className="w-full"
          >
            {logMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Añadir a {MEAL_LABELS[meal]}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}