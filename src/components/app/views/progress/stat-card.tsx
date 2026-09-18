"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon,
  label,
  value,
  sub,
  progress,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  progress?: number;
  tone?: "good" | "ok" | "low";
}) {
  const progressClass =
    tone === "good"
      ? "bg-emerald-progress"
      : tone === "ok"
        ? "bg-amber-progress"
        : "bg-rose-progress";

  const valueColor =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "ok"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "low"
          ? "text-rose-600 dark:text-rose-400"
          : "";

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          {icon} {label}
        </div>
        <div className={cn("text-xl font-bold tabular-nums", valueColor)}>
          {value}
        </div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
        {progress !== undefined && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progressClass,
              )}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}