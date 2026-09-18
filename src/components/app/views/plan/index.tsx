"use client";

import { useState } from "react";
import { CalendarDays, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekPlanSection } from "./week-plan-section";
import { RecipesSection } from "./recipes-section";

export function PlanView() {
  const [section, setSection] = useState<"week" | "recipes">("week");

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Control segmentado */}
      <div className="flex gap-1 p-1 bg-accent/60 rounded-lg">
        <button
          onClick={() => setSection("week")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors",
            section === "week"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" /> Semana
        </button>
        <button
          onClick={() => setSection("recipes")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors",
            section === "recipes"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Utensils className="h-3.5 w-3.5" /> Recetas
        </button>
      </div>

      {section === "week" ? <WeekPlanSection /> : <RecipesSection />}
    </div>
  );
}