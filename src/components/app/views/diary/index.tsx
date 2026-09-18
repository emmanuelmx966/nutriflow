"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Utensils, Dumbbell } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { formatDateLabel, todayLocalString } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { MealsSection } from "./meals-section";
import { ExerciseSection } from "./exercise-section";

export function DiaryView() {
  const [section, setSection] = useState<"meals" | "exercise">("meals");
  const selectedDate = useAppStore((s) => s.selectedDate);
  const prevDay = useAppStore((s) => s.prevDay);
  const nextDay = useAppStore((s) => s.nextDay);
  const isToday = selectedDate === todayLocalString();

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Navegación de fecha */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevDay}
            aria-label="Día anterior"
          >
            ‹
          </Button>
          <span className="text-sm font-semibold px-1">
            {formatDateLabel(selectedDate)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextDay}
            aria-label="Día siguiente"
          >
            ›
          </Button>
        </div>
        {!isToday && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => useAppStore.getState().goToday()}
          >
            Hoy
          </Button>
        )}
      </div>

      {/* Control segmentado */}
      <div className="flex gap-1 p-1 bg-accent/60 rounded-lg">
        <button
          onClick={() => setSection("meals")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors",
            section === "meals"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Utensils className="h-3.5 w-3.5" /> Comidas
        </button>
        <button
          onClick={() => setSection("exercise")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors",
            section === "exercise"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Dumbbell className="h-3.5 w-3.5" /> Ejercicios
        </button>
      </div>

      {section === "meals" ? (
        <MealsSection date={selectedDate} />
      ) : (
        <ExerciseSection date={selectedDate} />
      )}
    </div>
  );
}