"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type Recipe } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChefHat } from "lucide-react";
import { RecipeCreator } from "./recipe-creator";
import { RecipeCard } from "./recipe-card";

export function RecipesSection() {
  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes", "mine"],
    queryFn: () => api.get<Recipe[]>("/api/recipes?scope=mine"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-emerald-500" /> Mis recetas
        </h2>
        <RecipeCreator />
      </div>

      <p className="text-xs text-muted-foreground -mt-2">
        Guarda tus combinaciones de comidas como recetas reutilizables.
        Regístralas en tu diario con un toque.
      </p>

      {isLoading ? (
        <RecipeListSkeleton />
      ) : recipes && recipes.length > 0 ? (
        <ul className="space-y-2">
          {recipes.map((r) => (
            <li key={r.id}>
              <RecipeCard recipe={r} />
            </li>
          ))}
        </ul>
      ) : (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-12 text-center">
            <ChefHat className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <div className="text-sm font-medium">Aún no hay recetas</div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Crea tu primera receta — combina alimentos en una comida que
              puedas registrar con un solo toque.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecipeListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}