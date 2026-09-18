"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type UserProfile, type DashboardData } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, User, Target, Droplets, BookOpen } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

interface OnboardingTask {
  id: string;
  label: string;
  done: boolean;
  action?: () => void;
  icon: typeof User;
}

/**
 * Onboarding checklist — shown when profile is incomplete or first food not logged.
 * Improves activation + guides users to first value.
 */
export function OnboardingChecklist() {
  const setView = useAppStore((s) => s.setView);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<UserProfile>("/api/profile"),
  });
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard", useAppStore.getState().selectedDate],
    queryFn: () => api.get<DashboardData>(`/api/stats?date=${useAppStore.getState().selectedDate}`),
  });

  if (!profile) return null;

  const tasks: OnboardingTask[] = [
    {
      id: "profile",
      label: "Complete your profile",
      done: !!(profile.gender && profile.birthDate && profile.heightCm && profile.weightKg && profile.activityLevel),
      action: () => setView("profile"),
      icon: User,
    },
    {
      id: "goal",
      label: "Set your goal type",
      done: !!profile.goalType,
      action: () => setView("profile"),
      icon: Target,
    },
    {
      id: "first_food",
      label: "Log your first food",
      done: (dashboard?.consumed.calories ?? 0) > 0,
      action: () => setView("diary"),
      icon: BookOpen,
    },
    {
      id: "water",
      label: "Log water intake",
      done: (dashboard?.waterMl ?? 0) > 0,
      action: () => setView("dashboard"),
      icon: Droplets,
    },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  const allDone = completedCount === tasks.length;

  // Hide when fully complete
  if (allDone) return null;

  return (
    <Card className="border-emerald-200/50 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 to-background dark:from-emerald-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <Target className="h-4 w-4 text-emerald-500" /> Get started
            </div>
            <div className="text-[11px] text-muted-foreground">{completedCount} of {tasks.length} complete</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {Math.round((completedCount / tasks.length) * 100)}<span className="text-xs">%</span>
            </div>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full bg-emerald-progress rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / tasks.length) * 100}%`, background: "linear-gradient(to right, #34d399, #059669)" }}
          />
        </div>
        <ul className="space-y-1.5">
          {tasks.map((task) => {
            const Icon = task.icon;
            return (
              <li key={task.id}>
                <button
                  onClick={task.action}
                  disabled={task.done}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                    task.done ? "opacity-60" : "hover:bg-accent",
                  )}
                >
                  {task.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", task.done ? "text-emerald-500" : "text-muted-foreground")} />
                  <span className={cn("text-xs", task.done ? "line-through text-muted-foreground" : "font-medium")}>
                    {task.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
