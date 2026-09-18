"use client";

import { useState } from "react";
import { Scale, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeightSection } from "./weight-section";
import { AchievementsSection } from "./achievements-section";

export function ProgressView() {
  const [section, setSection] = useState<"weight" | "achievements">("weight");

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Control segmentado */}
      <div className="flex gap-1 p-1 bg-accent/60 rounded-lg">
        <button
          onClick={() => setSection("weight")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors",
            section === "weight"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Scale className="h-3.5 w-3.5" /> Peso
        </button>
        <button
          onClick={() => setSection("achievements")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors",
            section === "achievements"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Award className="h-3.5 w-3.5" /> Logros
        </button>
      </div>

      {section === "weight" ? <WeightSection /> : <AchievementsSection />}
    </div>
  );
}