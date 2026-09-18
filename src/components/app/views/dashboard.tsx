"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type DashboardData, type DiaryDay } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Droplets, Flame, Footprints, Plus, Minus, TimerReset, Zap, Coffee, Sun, Moon, Cookie, TrendingUp, Lightbulb } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { formatDateLabel, todayLocalString } from "@/lib/utils/date";
import { toast } from "sonner";
import { TipsService, type NutritionTip } from "@/lib/services/tips-service";
import { QuickAdd } from "@/components/app/quick-add";
import { RecommendationsCard } from "@/components/app/recommendations-card";
import { PerMealTargetsCard } from "@/components/app/per-meal-targets-card";
import { NutritionScoreCard } from "@/components/app/nutrition-score-card";
import { WeeklySummaryCard } from "@/components/app/weekly-summary-card";
import { MacroBreakdownChart } from "@/components/app/macro-breakdown-chart";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { useMemo } from "react";
import { OnboardingChecklist } from "@/components/app/onboarding-checklist";

const MEALS = [
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "lunch", label: "Lunch", icon: Sun },
  { id: "dinner", label: "Dinner", icon: Moon },
  { id: "snack", label: "Snacks", icon: Cookie },
] as const;

export function DashboardView() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setView = useAppStore((s) => s.setView);
  const prevDay = useAppStore((s) => s.prevDay);
  const nextDay = useAppStore((s) => s.nextDay);
  const qc = useQueryClient();

  const isToday = selectedDate === todayLocalString();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", selectedDate],
    queryFn: () => api.get<DashboardData>(`/api/stats?date=${selectedDate}`),
  });

  // Fetch full diary day for per-meal breakdown
  const { data: diaryDay } = useQuery({
    queryKey: ["diary", selectedDate],
    queryFn: () => api.get<DiaryDay>(`/api/diary?date=${selectedDate}`),
  });

  const waterMutation = useMutation({
    mutationFn: (delta: number) =>
      api.post(`/api/water`, { date: new Date().toISOString(), amountMl: clampWater((data?.waterMl ?? 0) + delta) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", selectedDate] });
      qc.invalidateQueries({ queryKey: ["water", selectedDate] });
    },
    onError: () => toast.error("Could not update water"),
  });

  const fastMutation = useMutation({
    mutationFn: () => api.del(`/api/fasting`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", selectedDate] });
      toast.success("Fast ended");
    },
    onError: () => toast.error("Could not end fast"),
  });

  const goal = data?.goal;
  const consumed = data?.consumed;
  const burned = data?.burned ?? 0;
  const calorieGoal = goal?.calorieGoal ?? 2000;
  const proteinGoal = goal?.proteinGoalG ?? 120;
  const carbGoal = goal?.carbGoalG ?? 220;
  const fatGoal = goal?.fatGoalG ?? 65;
  const waterGoal = goal?.waterGoalMl ?? 2000;

  const consumedCal = consumed?.calories ?? 0;
  const consumedProtein = consumed?.protein ?? 0;
  const consumedCarbs = consumed?.carbs ?? 0;
  const consumedFat = consumed?.fat ?? 0;
  const remainingCal = Math.round(calorieGoal - consumedCal + burned);
  const ringPct = Math.min(1, Math.max(0, consumedCal / calorieGoal));

  const weeklyData = useMemo(() => {
    return (data?.weekly ?? []).map((d) => ({
      label: new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "narrow" }),
      calories: d.consumed.calories,
      goal: calorieGoal,
      over: d.consumed.calories > calorieGoal,
    }));
  }, [data, calorieGoal]);

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Date selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={prevDay} aria-label="Previous day">‹</Button>
          <span className="text-sm font-semibold px-1">{formatDateLabel(selectedDate)}</span>
          <Button variant="ghost" size="sm" onClick={nextDay} aria-label="Next day">›</Button>
        </div>
        {!isToday && (
          <Button variant="outline" size="sm" onClick={() => useAppStore.getState().goToday()}>
            Today
          </Button>
        )}
      </div>

      {/* Onboarding checklist (auto-hides when complete) */}
      <OnboardingChecklist />

      {/* Nutrition score */}
      <NutritionScoreCard />

      {/* Calorie ring + summary */}
      <Card className="overflow-hidden border-border/60 shadow-sm shadow-emerald-900/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-5">
            <CalorieRing pct={ringPct} consumed={consumedCal} goal={calorieGoal} />
            <div className="flex-1 space-y-2.5 min-w-0">
              <div className="rounded-lg bg-accent/50 px-3 py-2">
                <StatRow icon={<Flame className="h-4 w-4 text-orange-500" />} label="Remaining" value={`${remainingCal}`} unit="kcal" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MiniStat icon={<Zap className="h-3.5 w-3.5 text-emerald-500" />} label="Eaten" value={Math.round(consumedCal)} />
                <MiniStat icon={<Footprints className="h-3.5 w-3.5 text-sky-500" />} label="Burned" value={Math.round(burned)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macro breakdown */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-1 pt-4">
          <CardTitle className="text-sm font-semibold">Macros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          <MacroBar label="Protein" value={consumedProtein} goal={proteinGoal} color="bg-rose-500" />
          <MacroBar label="Carbs" value={consumedCarbs} goal={carbGoal} color="bg-amber-500" />
          <MacroBar label="Fat" value={consumedFat} goal={fatGoal} color="bg-violet-500" />
        </CardContent>
      </Card>

      {/* Nutrition tips */}
      <NutritionTipsCard data={data} />

      {/* Quick add (recent + favorites) */}
      <QuickAdd />

      {/* Recipe recommendations */}
      <RecommendationsCard data={data} />

      {/* Water + Fasting quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/60 shadow-sm shadow-emerald-900/5 flex flex-col">
          <CardContent className="p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Droplets className="h-3.5 w-3.5 text-sky-500" /> Water
              </span>
              <span className="text-xs text-muted-foreground">{Math.round((data.waterMl / waterGoal) * 100)}%</span>
            </div>
            <div className="text-xl font-bold">
              {data.waterMl}
              <span className="text-xs font-normal text-muted-foreground ml-1">/ {waterGoal} ml</span>
            </div>
            <Progress value={(data.waterMl / waterGoal) * 100} className="h-1.5 my-2" />
            <div className="flex gap-1.5 mt-auto">
              <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => waterMutation.mutate(-250)}>
                <Minus className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => waterMutation.mutate(250)}>+250</Button>
              <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => waterMutation.mutate(500)}>+500</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm shadow-emerald-900/5 flex flex-col">
          <CardContent className="p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <TimerReset className="h-3.5 w-3.5 text-indigo-500" /> Fasting
              </span>
              {data.activeFast && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
            {data.activeFast ? (
              <ActiveFast startTime={data.activeFast.startTime} protocolHours={data.activeFast.protocolHours} onEnd={() => fastMutation.mutate()} />
            ) : (
              <div className="mt-auto">
                <div className="text-xl font-bold">Not fasting</div>
                <p className="text-xs text-muted-foreground mb-2 mt-0.5">Start an intermittent fast</p>
                <Button size="sm" variant="outline" className="h-7 w-full text-xs" onClick={() => setView("profile")}>
                  Start fast
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meal quick-add */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold">Meals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pb-3">
          {MEALS.map((meal) => {
            const mealLogs = (diaryDay?.logs ?? []).filter((l) => l.meal === meal.id);
            const mealCals = mealLogs.reduce((s, l) => s + l.calories, 0);
            const Icon = meal.icon;
            return (
              <button
                key={meal.id}
                onClick={() => setView("diary")}
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent group-hover:bg-background">
                    <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{meal.label}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {mealLogs.length > 0 ? `${mealLogs.length} item${mealLogs.length === 1 ? "" : "s"} · ${Math.round(mealCals)} kcal` : "Not logged"}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  {mealLogs.length > 0 && (
                    <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{Math.round(mealCals)}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    Add <Plus className="h-3.5 w-3.5" />
                  </span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Per-meal targets */}
      <PerMealTargetsCard data={data} diaryDay={diaryDay ?? undefined} />

      {/* Macro breakdown chart */}
      <MacroBreakdownChart data={data} />

      {/* Weekly summary (7-day avg + trend) */}
      <WeeklySummaryCard />

      {/* Weekly chart */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-1 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> This week
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" />
                <YAxis hide domain={[0, "dataMax"]} />
                <Tooltip
                  cursor={{ fill: "var(--accent)", opacity: 0.3 }}
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid var(--border)", fontSize: "12px" }}
                  formatter={(v: number) => [`${v} kcal`, "Calories"]}
                  labelFormatter={(_, p) => p?.[0]?.payload?.label}
                />
                <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                  {weeklyData.map((d, i) => (
                    <Cell key={i} fill={d.over ? "#f97316" : "var(--primary)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {data.weight && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-accent/50 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Latest weight</span>
              <span className="font-semibold">{data.weight.weightKg.toFixed(1)} kg</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CalorieRing({ pct, consumed, goal }: { pct: number; consumed: number; goal: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const over = consumed > goal;
  const remaining = Math.round(goal - consumed);
  return (
    <div className="relative h-[140px] w-[140px] shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.7 0.15 155)" />
            <stop offset="100%" stopColor="oklch(0.55 0.16 160)" />
          </linearGradient>
          <linearGradient id="ringGradOver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.7 0.19 30)" />
            <stop offset="100%" stopColor="oklch(0.55 0.22 27)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={over ? "url(#ringGradOver)" : "url(#ringGrad)"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none tabular-nums">{Math.round(consumed)}</span>
        <span className="text-[10px] text-muted-foreground mt-1">of {goal}</span>
        <span className="text-[10px] text-muted-foreground">kcal</span>
        {over ? (
          <span className="mt-1 text-[9px] font-medium text-orange-600 dark:text-orange-400">
            +{Math.abs(remaining)} over
          </span>
        ) : remaining > 0 ? (
          <span className="mt-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
            {remaining} left
          </span>
        ) : null}
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon} {label}</span>
      <span className="text-sm font-semibold">
        {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-accent/40 px-2.5 py-1.5">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">{icon}{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const over = value > goal;
  const solidColor = {
    "bg-rose-500": color.includes("rose"),
    "bg-amber-500": color.includes("amber"),
    "bg-violet-500": color.includes("violet"),
  }[color] ?? color;
  const overClass = over ? "bg-rose-progress" : "";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          <span className={`font-semibold tabular-nums ${over ? "text-orange-600 dark:text-orange-400" : "text-foreground"}`}>
            {formatMacro(value)}g
          </span>
          <span className="mx-0.5">/</span>
          <span className="tabular-nums">{goal}g</span>
          {over && <span className="ml-1 text-[10px] text-orange-500 font-medium">over</span>}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${over ? overClass : solidColor} rounded-full transition-all duration-500 shadow-sm`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}

function ActiveFast({ startTime, protocolHours, onEnd }: { startTime: string; protocolHours: number; onEnd: () => void }) {
  const start = new Date(startTime);
  const now = new Date();
  const elapsedMs = now.getTime() - start.getTime();
  const elapsedH = elapsedMs / 3600000;
  const hrs = Math.floor(elapsedH);
  const mins = Math.floor((elapsedH - hrs) * 60);
  return (
    <>
      <div className="text-xl font-bold tabular-nums">{hrs}h {mins}m</div>
      <p className="text-xs text-muted-foreground mb-2 mt-0.5">{protocolHours}:8 protocol · {Math.round((elapsedH / protocolHours) * 100)}%</p>
      <Button size="sm" variant="outline" className="h-7 w-full text-xs" onClick={onEnd}>End fast</Button>
    </>
  );
}

function clampWater(v: number) {
  return Math.max(0, Math.min(10000, Math.round(v)));
}

function formatMacro(v: number): string {
  // Show 1 decimal if under 10, whole number if >= 10
  if (v < 10) return (Math.round(v * 10) / 10).toFixed(1);
  return String(Math.round(v));
}

function NutritionTipsCard({ data }: { data: DashboardData }) {
  const tips = TipsService.generate(data);
  if (tips.length === 0) return null;

  return (
    <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Lightbulb className="h-4 w-4 text-amber-500" /> Smart tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        {tips.map((tip: NutritionTip) => {
          const bgClass =
            tip.tone === "good"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/40"
              : tip.tone === "warning"
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/40"
                : "bg-sky-50 dark:bg-sky-950/30 border-sky-200/50 dark:border-sky-900/40";
          return (
            <div key={tip.id} className={`rounded-lg border p-2.5 flex items-start gap-2.5 ${bgClass}`}>
              <span className="text-lg shrink-0">{tip.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold leading-tight">{tip.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{tip.message}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}