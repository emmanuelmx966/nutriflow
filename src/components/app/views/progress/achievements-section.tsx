"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type InsightsData, type Goal } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Flame,
  Trophy,
  Target,
  TrendingUp,
  Apple,
  Dumbbell,
  Droplets,
  Calendar,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { ScoreHistoryChart } from "@/components/app/score-history-chart";
import { MilestonesCard } from "@/components/app/milestones-card";
import { StatCard } from "./stat-card";

export function AchievementsSection() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: () => api.get<InsightsData>("/api/insights"),
  });
  const { data: goalsData } = useQuery({
    queryKey: ["goals"],
    queryFn: () =>
      api.get<{ active: Goal | null; history: Goal[] }>("/api/goals"),
  });

  if (isLoading || !insights) return <AchievementsSkeleton />;

  const { streak, achievements, weeklyAverages } = insights;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const goal = goalsData?.active;
  const calorieGoal = goal?.calorieGoal ?? 2000;

  const chartData = weeklyAverages.map((d) => ({
    label: new Date(d.date + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "narrow",
    }),
    calories: d.calories,
  }));

  return (
    <div className="space-y-4">
      {/* Racha destacada */}
      <div className="bg-streak-gradient rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-orange-50/90 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" /> Racha actual
            </div>
            <div className="text-4xl font-bold tabular-nums mt-1">
              {streak.currentStreak}
            </div>
            <div className="text-xs text-orange-50/90">
              {streak.currentStreak === 0
                ? "¡Registra hoy para empezar!"
                : `día${streak.currentStreak === 1 ? "" : "s"} seguido${streak.currentStreak === 1 ? "" : "s"}`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-orange-50/90">Mejor</div>
            <div className="text-2xl font-bold tabular-nums">
              {streak.longestStreak}
            </div>
            <div className="text-[10px] text-orange-50/80">
              {streak.totalDaysLogged} días registrados
            </div>
          </div>
        </div>
        {streak.currentStreak >= 2 && (
          <div className="mt-3 flex gap-1">
            {Array.from({ length: Math.min(streak.currentStreak, 14) }).map(
              (_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full bg-white/40 animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ),
            )}
          </div>
        )}
      </div>

      {/* Historial de puntuación */}
      <ScoreHistoryChart />

      {/* Estadísticas clave */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Target className="h-4 w-4 text-emerald-500" />}
          label="Adherencia a meta"
          value={`${insights.goalAdherence}%`}
          sub={
            insights.goalAdherence === 0
              ? "registra para ver"
              : "dentro de ±15% de tu meta"
          }
          progress={insights.goalAdherence}
          tone={
            insights.goalAdherence >= 80
              ? "good"
              : insights.goalAdherence >= 50
                ? "ok"
                : "low"
          }
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-sky-500" />}
          label="Promedio calorías"
          value={String(insights.weeklyAvgCalories)}
          sub={`de ${calorieGoal} kcal meta`}
        />
        <StatCard
          icon={<Apple className="h-4 w-4 text-rose-500" />}
          label="Alimentos registrados"
          value={String(insights.totalFoodsLogged)}
          sub="total histórico"
        />
        <StatCard
          icon={<Dumbbell className="h-4 w-4 text-violet-500" />}
          label="Ejercicios registrados"
          value={String(insights.totalExercisesLogged)}
          sub="total histórico"
        />
      </div>

      {/* Gráfica de los últimos 7 días */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-1 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-emerald-500" /> Últimos 7 días
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`${v} kcal`, "Calorías"]}
                />
                {insights.weeklyAvgCalories > 0 && (
                  <ReferenceLine
                    y={insights.weeklyAvgCalories}
                    stroke="var(--primary)"
                    strokeDasharray="4 4"
                    label={{
                      value: "prom",
                      fontSize: 9,
                      fill: "var(--primary)",
                      position: "right",
                    }}
                  />
                )}
                {calorieGoal > 0 && (
                  <ReferenceLine
                    y={calorieGoal}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="2 2"
                    label={{
                      value: "meta",
                      fontSize: 9,
                      fill: "var(--muted-foreground)",
                      position: "left",
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: "var(--primary)",
                    strokeWidth: 2,
                    stroke: "var(--background)",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Logros */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" /> Logros
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {unlockedCount}/{achievements.length} desbloqueados
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-3 gap-2">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "relative rounded-xl border p-3 text-center transition-all",
                  a.unlocked
                    ? "border-amber-200 bg-achievement-gradient shadow-sm dark:border-amber-900/40"
                    : "border-border/60 bg-muted/30 opacity-60",
                )}
              >
                <div
                  className={cn(
                    "text-2xl mb-1",
                    !a.unlocked && "grayscale opacity-40",
                  )}
                >
                  {a.unlocked ? a.icon : "🔒"}
                </div>
                <div className="text-[10px] font-semibold leading-tight">
                  {a.title}
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                  {a.description}
                </div>
                {!a.unlocked && a.target > 1 && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width: `${Math.min(100, (a.progress / a.target) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {a.progress}/{a.target}
                    </div>
                  </div>
                )}
                {a.unlocked && (
                  <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-amber-400 flex items-center justify-center">
                    <svg
                      viewBox="0 0 12 12"
                      className="h-2.5 w-2.5 text-white"
                      fill="currentColor"
                    >
                      <path
                        d="M10 3L4.5 8.5 2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <MilestonesCard />

      {/* Miembro desde + agua */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-sky-500" />
            <div>
              <div className="text-xs text-muted-foreground">
                Agua total registrada
              </div>
              <div className="text-sm font-semibold">
                {(insights.totalWaterLogged / 1000).toFixed(1)}L histórico
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Miembro desde</div>
            <div className="text-sm font-semibold">
              {new Date(insights.memberSince).toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AchievementsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}