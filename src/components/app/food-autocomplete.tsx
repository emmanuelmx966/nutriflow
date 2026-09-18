"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AutocompleteFood } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Plus } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FoodAutocompleteProps {
  meal: string;
  date: string;
  onLogged?: () => void;
}

/**
 * FoodAutocomplete — instant search suggestions as you type.
 * Shows top 8 matches with calories, 1-tap to log default serving.
 */
export function FoodAutocomplete({ meal, date, onLogged }: FoodAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: results, isFetching } = useQuery({
    queryKey: ["food-autocomplete", query],
    queryFn: () => api.get<AutocompleteFood[]>(`/api/foods/autocomplete?q=${encodeURIComponent(query)}&limit=8`),
    enabled: query.length >= 1,
    staleTime: 30 * 1000,
  });

  const logMutation = useMutation({
    mutationFn: (food: AutocompleteFood) =>
      api.post("/api/diary", {
        date: new Date(date + "T12:00:00").toISOString(),
        meal,
        foodId: food.type === "food" ? food.id : undefined,
        customFoodId: food.type === "custom" ? food.id : undefined,
        quantityG: food.defaultServingG,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", date] });
      qc.invalidateQueries({ queryKey: ["dashboard", date] });
      qc.invalidateQueries({ queryKey: ["recent-foods"] });
      toast.success("Added to diary");
      setQuery("");
      setFocused(false);
      inputRef.current?.blur();
      onLogged?.();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add"),
  });

  const items = results ?? [];

  // Reset selection when query changes (keyed render)
  const selectedIndexKey = query;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!focused || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && items[selectedIndex]) {
      e.preventDefault();
      logMutation.mutate(items[selectedIndex]);
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search foods to quick-add..."
          className="pl-9 pr-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {focused && query.length >= 1 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg shadow-emerald-900/10 max-h-72 overflow-y-auto scroll-slim">
          {items.length > 0 ? (
            <ul className="py-1" key={selectedIndexKey}>
              {items.map((food, idx) => (
                <li key={food.id}>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      logMutation.mutate(food);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors",
                      idx === selectedIndex ? "bg-accent" : "hover:bg-accent/50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{food.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {food.servingCalories} kcal · {Math.round(food.defaultServingG)}g · {food.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {food.type === "custom" && (
                        <Badge variant="secondary" className="text-[8px] h-3.5">custom</Badge>
                      )}
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <Plus className="h-3 w-3" />
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : !isFetching ? (
            <div className="py-6 px-3 text-center text-xs text-muted-foreground">
              No foods found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
