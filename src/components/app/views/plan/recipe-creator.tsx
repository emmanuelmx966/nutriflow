"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type FoodItem,
  type FoodSearchResult,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Search, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

interface DraftIngredient {
  id: string;
  foodId?: string;
  name: string;
  quantityG: number;
}

export function RecipeCreator() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/recipes", {
        name,
        description: description || undefined,
        servings,
        ingredients: ingredients.map((i) => ({
          foodId: i.foodId,
          name: i.name,
          quantityG: i.quantityG,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Receta creada");
      setOpen(false);
      setName("");
      setDescription("");
      setServings(1);
      setIngredients([]);
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Error al crear receta"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nueva receta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" /> Crear receta
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto scroll-slim flex-1 -mx-1 px-1">
          <div className="space-y-1.5">
            <Label>Nombre de la receta</Label>
            <Input
              placeholder="ej. Bowl de proteína matutino"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Textarea
              placeholder="Nota rápida sobre esta receta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Porciones</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setServings(Math.max(1, servings - 1))}
              >
                <span className="text-lg leading-none">−</span>
              </Button>
              <Input
                type="number"
                min="1"
                max="50"
                value={servings}
                onChange={(e) =>
                  setServings(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setServings(servings + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Ingredientes ({ingredients.length})</Label>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setSearchOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Añadir ingrediente
              </Button>
            </div>
            {ingredients.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">
                Añade al menos un ingrediente
              </div>
            ) : (
              <ul className="space-y-1">
                {ingredients.map((ing) => (
                  <li
                    key={ing.id}
                    className="flex items-center justify-between rounded-lg bg-accent/30 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{ing.name}</div>
                      <div className="text-muted-foreground">
                        {ing.quantityG}g
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        value={ing.quantityG}
                        onChange={(e) =>
                          setIngredients((arr) =>
                            arr.map((x) =>
                              x.id === ing.id
                                ? {
                                    ...x,
                                    quantityG: Math.max(
                                      1,
                                      parseInt(e.target.value) || 1,
                                    ),
                                  }
                                : x,
                            ),
                          )
                        }
                        className="h-7 w-16 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setIngredients((arr) =>
                            arr.filter((x) => x.id !== ing.id),
                          )
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={
              createMutation.isPending ||
              !name.trim() ||
              ingredients.length === 0
            }
            className="w-full"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Crear receta ({ingredients.length} ingredientes)</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <IngredientPicker
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onPick={(food) => {
          setIngredients((arr) => [
            ...arr,
            {
              id: crypto.randomUUID(),
              foodId: food.id,
              name: food.name,
              quantityG: Math.round(food.defaultServingG),
            },
          ]);
          setSearchOpen(false);
        }}
      />
    </Dialog>
  );
}

function IngredientPicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (food: FoodItem) => void;
}) {
  const [query, setQuery] = useState("");
  const { data, isFetching } = useQuery({
    queryKey: ["food-search", query],
    queryFn: () =>
      api.get<FoodSearchResult>(
        `/api/foods?query=${encodeURIComponent(query)}&limit=20`,
      ),
    enabled: query.length > 1 && open,
  });
  const results = [...(data?.foods ?? []), ...(data?.custom ?? [])];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQuery("");
      }}
    >
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Añadir ingrediente</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Buscar alimentos..."
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
              Sin resultados
            </div>
          )}
          <ul className="space-y-1">
            {results.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => onPick(f)}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {f.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {f.servingDesc}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 capitalize shrink-0"
                    >
                      {f.category}
                    </Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="w-full">
              Listo
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}