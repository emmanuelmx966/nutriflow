"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type FavoriteFood } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Star, Plus, Loader2, X, StarOff } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * QuickAdd — recent foods + favorites for 1-tap logging with management.
 * Recent: star a food to pin it as a favorite.
 * Favorites: unstar to remove from favorites.
 */
export function QuickAdd() {
  const [tab, setTab] = useState<"recent" | "favorites">("recent");
  const selectedDate = useAppStore((s) => s.selectedDate);
  const qc = useQueryClient();

  const { data: recent, isLoading: loadingRecent } = useQuery({
    queryKey: ["recent-foods"],
    queryFn: () => api.get<FavoriteFood[]>("/api/favorites?scope=recent"),
    enabled: tab === "recent",
  });

  const { data: favorites, isLoading: loadingFav } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api.get<FavoriteFood[]>("/api/favorites"),
    enabled: tab === "favorites",
  });

  const quickAddMutation = useMutation({
    mutationFn: (food: FavoriteFood) =>
      api.post("/api/diary", {
        date: new Date(selectedDate + "T12:00:00").toISOString(),
        meal: food.meal || "snack",
        foodId: food.foodId ?? undefined,
        customFoodId: food.customFoodId ?? undefined,
        quantityG: food.quantityG,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", selectedDate] });
      qc.invalidateQueries({ queryKey: ["dashboard", selectedDate] });
      qc.invalidateQueries({ queryKey: ["recent-foods"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Added to diary");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add"),
  });

  // Add to favorites manually (from recent tab)
  const addFavoriteMutation = useMutation({
    mutationFn: (food: FavoriteFood) =>
      api.post("/api/favorites", {
        foodId: food.foodId,
        customFoodId: food.customFoodId,
        quantityG: food.quantityG,
        meal: food.meal,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Added to favorites");
    },
    onError: () => toast.error("Could not add to favorites"),
  });

  // Remove from favorites
  const removeFavoriteMutation = useMutation({
    mutationFn: (favId: string) => api.del(`/api/favorites?id=${favId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Removed from favorites");
    },
    onError: () => toast.error("Could not remove"),
  });

  // Filter out entries without a linkable foodId/customFoodId (e.g. recipe entries)
  const items = (tab === "recent" ? recent : favorites)?.filter(
    (f) => f.foodId || f.customFoodId,
  );
  const isLoading = tab === "recent" ? loadingRecent : loadingFav;
  const favIds = new Set((favorites ?? []).map((f) => f.foodId || f.customFoodId));

  if (isLoading) {
    return (
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500" /> Quick add
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasItems = items && items.length > 0;

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500" /> Quick add
          </CardTitle>
          <div className="flex gap-0.5">
            <button
              onClick={() => setTab("recent")}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded-full transition-colors",
                tab === "recent"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Recent
            </button>
            <button
              onClick={() => setTab("favorites")}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded-full transition-colors",
                tab === "favorites"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Favorites {favorites && favorites.length > 0 && `(${favorites.length})`}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {hasItems ? (
          <ul className="space-y-1">
            {items!.slice(0, 5).map((food) => {
              const isFavorite = favIds.has(food.foodId || food.customFoodId || "");
              return (
                <li key={food.id} className="group relative">
                  <button
                    onClick={() => quickAddMutation.mutate(food)}
                    disabled={quickAddMutation.isPending}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 shrink-0">
                        {tab === "recent" ? (
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">{food.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {Math.round(food.quantityG)}g · {food.calories > 0 ? `${food.calories} kcal` : "—"} · {food.meal}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      {quickAddMutation.isPending && quickAddMutation.variables?.id === food.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </button>
                  {/* Star/unstar button */}
                  {tab === "recent" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isFavorite) {
                          // Find the favorite id to remove
                          const fav = favorites?.find(
                            (f) => (f.foodId || f.customFoodId) === (food.foodId || food.customFoodId),
                          );
                          if (fav) removeFavoriteMutation.mutate(fav.id);
                        } else {
                          addFavoriteMutation.mutate(food);
                        }
                      }}
                      className="absolute right-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star className={cn(
                        "h-3.5 w-3.5",
                        isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-400",
                      )} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavoriteMutation.mutate(food.id);
                      }}
                      className="absolute right-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      aria-label="Remove from favorites"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-6 text-center">
            <Star className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
            <div className="text-xs font-medium">
              {tab === "recent" ? "No recent foods" : "No favorites yet"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {tab === "recent"
                ? "Log foods and they'll appear here. Hover to star your favorites."
                : "Star foods from the Recent tab to pin them here for quick access"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
