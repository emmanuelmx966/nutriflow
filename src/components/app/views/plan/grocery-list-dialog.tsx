"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type GroceryList } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShoppingCart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GroceryListDialog({
  weekStart,
  disabled,
}: {
  weekStart: string;
  disabled: boolean;
}) {
  const { data: grocery, isLoading } = useQuery({
    queryKey: ["grocery-list", weekStart],
    queryFn: () =>
      api.get<GroceryList>(`/api/meal-plan/grocery?week=${weekStart}`),
    enabled: !disabled,
  });

  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(name: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <Dialog onOpenChange={() => setChecked(new Set())}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <ShoppingCart className="h-4 w-4 mr-1" /> Súper
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-emerald-500" /> Lista de
            supermercado
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : grocery && grocery.items.length > 0 ? (
          <>
            <div className="rounded-lg bg-accent/40 p-3 flex items-center justify-around text-center">
              <div>
                <div className="text-lg font-bold tabular-nums">
                  {grocery.totalItems}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  ingredientes
                </div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div>
                <div className="text-lg font-bold tabular-nums">
                  {Math.round(grocery.totalCalories)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  kcal totales
                </div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div>
                <div className="text-lg font-bold tabular-nums">
                  {checked.size}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  marcados
                </div>
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto scroll-slim space-y-1 -mx-1 px-1">
              {grocery.items.map((item) => {
                const isChecked = checked.has(item.name);
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => toggle(item.name)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors text-left",
                        isChecked
                          ? "bg-emerald-50 dark:bg-emerald-950/30 opacity-60"
                          : "hover:bg-accent",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={cn(
                            "h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                            isChecked
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-border",
                          )}
                        >
                          {isChecked && (
                            <svg
                              viewBox="0 0 12 12"
                              className="h-2.5 w-2.5 text-white"
                              fill="none"
                            >
                              <path
                                d="M10 3L4.5 8.5 2 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isChecked && "line-through",
                          )}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {item.totalGrams}g
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="py-8 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <div className="text-sm font-medium">
              No hay ingredientes por comprar
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Planifica algunas comidas con recetas para generar tu lista.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}