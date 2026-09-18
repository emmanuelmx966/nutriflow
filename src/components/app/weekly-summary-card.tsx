"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type WeeklySummary } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, TrendingUp, TrendingDown, Minus, Award } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

/**
 * WeeklySummaryCard — 7-day nutrition averages + trend on the dashboard.
 * Shows daily calorie bars + average + trend vs last week.
 */
export function WeeklySummaryCard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["weekly-summary"],
    queryFn: () => api.get<WeeklySummary>("/api/weekly-summary"),
  });

  if (isLoading || !summary) {
    return (
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-emerald-500" /> Weekly summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = summary.days.map((d) => ({
    label: new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "narrow" }),
    calories: d.calories,
    isToday: d.date === summary.days[summary.days.length - 1]?.date,
  }));

  const trendIcon = summary.trendCalories > 2 ? TrendingUp : summary.trendCalories < -2 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    summary.trendCalories > 2 ? "text-orange-500"
    : summary.trendCalories < -2 ? "text-emerald-500"
    : "text-muted-foreground";

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-emerald-500" /> Weekly summary
          </span>
          <span className={cn("flex items-center gap-0.5 text-xs font-normal", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {summary.trendCalories > 0 ? "+" : ""}{summary.trendCalories}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center justify-around mb-3">
          <div className="text-center">
            <div className="text-xl font-bold tabular-nums">{summary.avgCalories}</div>
            <div className="text-[10px] text-muted-foreground">avg kcal/day</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-xl font-bold tabular-nums">{summary.avgProtein}g</div>
            <div className="text-[10px] text-muted-foreground">avg protein</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-xl font-bold tabular-nums">{summary.daysLogged}/7</div>
            <div className="text-[10px] text-muted-foreground">days logged</div>
          </div>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={false} />
              <YAxis hide domain={[0, "dataMax"]} />
              <Tooltip
                cursor={{ fill: "var(--accent)", opacity: 0.3 }}
                contentStyle={{ borderRadius: "0.75rem", border: "1px solid var(--border)", fontSize: "11px" }}
                formatter={(v: number) => [`${v} kcal`, "Calories"]}
              />
              <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.isToday ? "var(--primary)" : "var(--muted-foreground)"} opacity={d.isToday ? 1 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {summary.bestDay && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Award className="h-3 w-3 text-amber-500" />
            Best day: {new Date(summary.bestDay.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })} ({summary.bestDay.calories} kcal)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
