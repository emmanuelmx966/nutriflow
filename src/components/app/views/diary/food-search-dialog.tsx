"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type FoodItem,
  type FoodSearchResult,
  type CustomFoodItem,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FoodDetail } from "./food-detail";
import { MEAL_LABELS, type MealId } from "./constants";

export function FoodSearchDialog({
  meal,
  date,
}: {
  meal: MealId;
  date: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | CustomFoodItem | null>(
    null,
  );
  const [servings, setServings] = useState(1);
  const qc = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ["food-search", query],
    queryFn: () =>
      api.get<FoodSearchResult>(
        `/api/foods?query=${encodeURIComponent(query)}&limit=20`,
      ),
    enabled: query.length > 1 && open,
  });

  const addMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("No food selected");
      const isCustom = "userId" in selected;
      return api.post("/api/diary", {
        date: new Date(date + "T12:00:00").toISOString(),
        meal,
        foodId: isCustom ? undefined : selected.id,
        customFoodId: isCustom ? selected.id : undefined,
        quantityG: Math.round(servings * selected.defaultServingG),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", date] });
      qc.invalidateQueries({ queryKey: ["dashboard", date] });
      toast.success("Añadido al diario");
      setOpen(false);
      setQuery("");
      setSelected(null);
      setServings(1);
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "No se pudo añadir"),
  });

  const results = [...(data?.foods ?? []), ...(data?.custom ?? [])];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setQuery("");
          setSelected(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1 text-emerald-600 dark:text-emerald-400"
        >
          <Plus className="h-4 w-4" /> Añadir
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="capitalize">
            Añadir a {MEAL_LABELS[meal]}
          </DialogTitle>
        </DialogHeader>

        {!selected ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Buscar alimentos (manzana, pollo, tortilla...)"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto scroll-slim -mx-1 px-1 min-h-[200px]">
              {query.length <= 1 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Escribe al menos 2 caracteres
                </div>
              )}
              {query.length > 1 && isFetching && (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {query.length > 1 && !isFetching && results.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Sin resultados. Prueba otra búsqueda.
                </div>
              )}
              <ul className="space-y-1">
                {results.map((f) => (
                  <li key={("userId" in f ? "c-" : "f-") + f.id}>
                    <button
                      onClick={() => {
                        setSelected(f);
                        setServings(1);
                      }}
                      className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {f.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {f.servingDesc} ·{" "}
                            {Math.round(
                              (f.caloriesPer100g * f.defaultServingG) / 100,
                            )}{" "}
                            kcal
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {"userId" in f && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] h-4"
                            >
                              propio
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 capitalize"
                          >
                            {f.category}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <FoodDetail
            food={selected}
            servings={servings}
            setServings={setServings}
            onBack={() => setSelected(null)}
            onAdd={() => addMutation.mutate()}
            isAdding={addMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}