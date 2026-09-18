"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type ScoreHistoryEntry } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

/**
 * ScoreHistoryChart — nutrition score trend over time (7/14/30 days).
 * Shows how the score evolves with a gradient area chart.
 */
export function ScoreHistoryChart() {
  const [range, setRange] = useState(14);
  const { data: history, isLoading } = useQuery({
    queryKey: ["score-history", range],
    queryFn: () => api.get<ScoreHistoryEntry[]>(`/api/score/history?days=${range}`),
  });

  const chartData = (history ?? []).map((h) => ({
    label: new Date(h.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: h.score,
    macro: h.macroAdherence,
    consistency: h.consistency,
    variety: h.foodVariety,
    hydration: h.hydration,
  }));

  const avgScore = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.score, 0) / chartData.length)
    : 0;
  const latestScore = chartData.length > 0 ? chartData[chartData.length - 1].score : 0;
  const firstScore = chartData.length > 0 ? chartData[0].score : 0;
  const trend = latestScore - firstScore;

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardHeader className="pb-1 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-violet-500" /> Score history
          </span>
          <div className="flex gap-0.5">
            {[7, 14, 30].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-1.5 py-0.5 text-[10px] font-medium rounded-full transition-colors",
                  range === r
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-sm text-muted-foreground">
            <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
            No score history yet
            <span className="text-xs">Visit your dashboard to generate today's score</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[10px] text-muted-foreground">Latest</div>
                  <div className="text-xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{latestScore}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Average</div>
                  <div className="text-xl font-bold tabular-nums">{avgScore}</div>
                </div>
                {trend !== 0 && (
                  <div>
                    <div className="text-[10px] text-muted-foreground">Trend</div>
                    <div className={cn(
                      "text-xl font-bold tabular-nums",
                      trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                    )}>
                      {trend > 0 ? "+" : ""}{trend}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "currentColor" }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={20}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: "currentColor" }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "0.75rem", border: "1px solid var(--border)", fontSize: "11px" }}
                    formatter={(v: number) => [`${v}`, "Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#scoreGrad)"
                    dot={{ r: 2, fill: "var(--primary)" }}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
