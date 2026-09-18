"use client";

import type { DashboardData } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

/**
 * MacroBreakdownChart — shows % of calories from protein/carbs/fat as a donut chart.
 * Uses today's consumed macros from dashboard data.
 */
export function MacroBreakdownChart({ data }: { data: DashboardData }) {
  const consumed = data.consumed;
  const proteinCals = consumed.protein * 4;
  const carbCals = consumed.carbs * 4;
  const fatCals = consumed.fat * 9;
  const totalMacroCals = proteinCals + carbCals + fatCals;

  if (totalMacroCals === 0) {
    return (
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <PieIcon className="h-4 w-4 text-violet-500" /> Calorie breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 py-8 text-center">
          <PieIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">Log food to see your macro breakdown</div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: "Protein", value: Math.round(proteinCals), color: "#f43f5e", grams: Math.round(consumed.protein) },
    { name: "Carbs", value: Math.round(carbCals), color: "#f59e0b", grams: Math.round(consumed.carbs) },
    { name: "Fat", value: Math.round(fatCals), color: "#8b5cf6", grams: Math.round(consumed.fat) },
  ].filter((d) => d.value > 0);

  const proteinPct = Math.round((proteinCals / totalMacroCals) * 100);
  const carbPct = Math.round((carbCals / totalMacroCals) * 100);
  const fatPct = 100 - proteinPct - carbPct;

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <PieIcon className="h-4 w-4 text-violet-500" /> Calorie breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-24 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={44}
                  paddingAngle={2}
                >
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid var(--border)", fontSize: "11px" }}
                  formatter={(v: number, _n: string, p: { payload?: { grams?: number } }) => [`${v} kcal (${p?.payload?.grams ?? 0}g)`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5">
            <BreakdownRow label="Protein" pct={proteinPct} grams={Math.round(consumed.protein)} color="bg-rose-500" />
            <BreakdownRow label="Carbs" pct={carbPct} grams={Math.round(consumed.carbs)} color="bg-amber-500" />
            <BreakdownRow label="Fat" pct={fatPct} grams={Math.round(consumed.fat)} color="bg-violet-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownRow({ label, pct, grams, color }: { label: string; pct: number; grams: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color} shrink-0`} />
      <span className="text-xs font-medium w-14 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">{pct}% · {grams}g</span>
    </div>
  );
}
