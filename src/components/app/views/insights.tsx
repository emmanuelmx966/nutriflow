"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type InsightsData, type Goal } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Trophy, Target, TrendingUp, Apple, Dumbbell, Droplets, Calendar } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { ScoreHistoryChart } from "@/components/app/score-history-chart";
import { MilestonesCard } from "@/components/app/milestones-card";
import { LeaderboardCard } from "@/components/app/leaderboard-card";

export function InsightsView() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: () => api.get<InsightsData>("/api/insights"),
  });
  const { data: goalsData } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<{ active: Goal | null; history: Goal[] }>("/api/goals"),
  });

  if (isLoading || !insights) return <InsightsSkeleton />;

  const { streak, achievements, weeklyAverages } = insights;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const goal = goalsData?.active;
  const calorieGoal = goal?.calorieGoal ?? 2000;

  // chart data: last 7 days
  const chartData = weeklyAverages.map((d) => ({
    label: new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "narrow" }),
    calories: d.calories,
  }));

  return (
    <div className="space-y-4 animate-fade-in-up">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-emerald-500" /> Insights
      </h2>

      {/* Streak hero card */}
      <div className="bg-streak-gradient rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-orange-50/90 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" /> Current streak
            </div>
            <div className="text-4xl font-bold tabular-nums mt-1">{streak.currentStreak}</div>
            <div className="text-xs text-orange-50/90">
              {streak.currentStreak === 0 ? "Log today to start!" : `day${streak.currentStreak === 1 ? "" : "s"} in a row`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-orange-50/90">Best</div>
            <div className="text-2xl font-bold tabular-nums">{streak.longestStreak}</div>
            <div className="text-[10px] text-orange-50/80">{streak.totalDaysLogged} days logged</div>
          </div>
        </div>
        {streak.currentStreak >= 2 && (
          <div className="mt-3 flex gap-1">
            {Array.from({ length: Math.min(streak.currentStreak, 14) }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full bg-white/40 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Score history chart */}
      <ScoreHistoryChart />

      {/* Key stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Target className="h-4 w-4 text-emerald-500" />}
          label="Goal adherence"
          value={`${insights.goalAdherence}%`}
          sub={insights.goalAdherence === 0 ? "log to see" : "within ±15% of goal"}
          progress={insights.goalAdherence}
          tone={insights.goalAdherence >= 80 ? "good" : insights.goalAdherence >= 50 ? "ok" : "low"}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-sky-500" />}
          label="Avg calories"
          value={String(insights.weeklyAvgCalories)}
          sub={`of ${calorieGoal} kcal goal`}
        />
        <StatCard
          icon={<Apple className="h-4 w-4 text-rose-500" />}
          label="Foods logged"
          value={String(insights.totalFoodsLogged)}
          sub="all time"
        />
        <StatCard
          icon={<Dumbbell className="h-4 w-4 text-violet-500" />}
          label="Exercises logged"
          value={String(insights.totalExercisesLogged)}
          sub="all time"
        />
      </div>

      {/* Weekly calorie chart */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-1 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-emerald-500" /> Last 7 days
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid var(--border)", fontSize: "12px" }}
                  formatter={(v: number) => [`${v} kcal`, "Calories"]}
                />
                {insights.weeklyAvgCalories > 0 && (
                  <ReferenceLine
                    y={insights.weeklyAvgCalories}
                    stroke="var(--primary)"
                    strokeDasharray="4 4"
                    label={{ value: "avg", fontSize: 9, fill: "var(--primary)", position: "right" }}
                  />
                )}
                {calorieGoal > 0 && (
                  <ReferenceLine
                    y={calorieGoal}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="2 2"
                    label={{ value: "goal", fontSize: 9, fill: "var(--muted-foreground)", position: "left" }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--background)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-amber-500" /> Achievements</span>
            <span className="text-xs font-normal text-muted-foreground">
              {unlockedCount}/{achievements.length} unlocked
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
                <div className={cn("text-2xl mb-1", !a.unlocked && "grayscale opacity-40")}>
                  {a.unlocked ? a.icon : "🔒"}
                </div>
                <div className="text-[10px] font-semibold leading-tight">{a.title}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{a.description}</div>
                {!a.unlocked && a.target > 1 && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${Math.min(100, (a.progress / a.target) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {a.progress}/{a.target}
                    </div>
                  </div>
                )}
                {a.unlocked && (
                  <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-amber-400 flex items-center justify-center">
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="currentColor"><path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Score milestones */}
      <MilestonesCard />

      {/* Community leaderboard */}
      <LeaderboardCard />

      {/* Member since */}
      <Card className="border-border/60 shadow-sm shadow-emerald-900/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-sky-500" />
            <div>
              <div className="text-xs text-muted-foreground">Total water logged</div>
              <div className="text-sm font-semibold">{(insights.totalWaterLogged / 1000).toFixed(1)}L all time</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Member since</div>
            <div className="text-sm font-semibold">
              {new Date(insights.memberSince).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
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
        <div className={cn("text-xl font-bold tabular-nums", valueColor)}>{value}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
        {progress !== undefined && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", progressClass)}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-32" />
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
