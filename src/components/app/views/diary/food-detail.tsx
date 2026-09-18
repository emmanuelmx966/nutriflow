"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FoodItem, CustomFoodItem } from "@/lib/api-client";

export function FoodDetail({
  food,
  servings,
  setServings,
  onBack,
  onAdd,
  isAdding,
}: {
  food: FoodItem | CustomFoodItem;
  servings: number;
  setServings: (n: number) => void;
  onBack: () => void;
  onAdd: () => void;
  isAdding: boolean;
}) {
  const grams = Math.round(servings * food.defaultServingG);
  const factor = grams / 100;
  const cal = Math.round(food.caloriesPer100g * factor);
  const p = Math.round(food.proteinPer100g * factor * 10) / 10;
  const c = Math.round(food.carbsPer100g * factor * 10) / 10;
  const f = Math.round(food.fatPer100g * factor * 10) / 10;

  const presets = [0.5, 1, 1.5, 2, 3];

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ‹ Volver a búsqueda
      </button>
      <div>
        <div className="text-base font-semibold">{food.name}</div>
        {food.brand && (
          <div className="text-xs text-muted-foreground">{food.brand}</div>
        )}
        <div className="text-xs text-muted-foreground mt-0.5">
          {food.servingDesc}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-xl bg-accent/40 p-3 text-center">
        <div>
          <div className="text-lg font-bold tabular-nums">{cal}</div>
          <div className="text-[10px] text-muted-foreground">kcal</div>
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums">{p}g</div>
          <div className="text-[10px] text-muted-foreground">proteína</div>
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums">{c}g</div>
          <div className="text-[10px] text-muted-foreground">carbos</div>
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums">{f}g</div>
          <div className="text-[10px] text-muted-foreground">grasa</div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Porciones ({grams}g)</Label>
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
              setServings(Math.max(0.25, parseFloat(e.target.value) || 0.25))
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
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              className={cn(
                "h-7 text-xs",
                servings === preset && "border-emerald-500 text-emerald-600",
              )}
              onClick={() => setServings(preset)}
            >
              {preset}×
            </Button>
          ))}
        </div>
      </div>

      <Button onClick={onAdd} disabled={isAdding} className="w-full">
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Añadir al diario"
        )}
      </Button>
    </div>
  );
}