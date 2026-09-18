"use client";

import { useSession } from "next-auth/react";
import { AuthScreen } from "@/components/app/auth-screen";
import { AppShell } from "@/components/app/app-shell";
import { DashboardView } from "@/components/app/views/dashboard";
import { DiaryView } from "@/components/app/views/diary";
import { ProgressView } from "@/components/app/views/progress";
import { PlanView } from "@/components/app/views/plan";
import { ReportsView } from "@/components/app/views/reports";
import { ProfileView } from "@/components/app/views/profile";
import { useAppStore } from "@/store/app-store";
import { Leaf } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const view = useAppStore((s) => s.view);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 animate-pulse">
          <Leaf className="h-7 w-7 text-white" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Cargando NutriFlow…</p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <AppShell>
      {view === "dashboard" && <DashboardView />}
      {view === "diary" && <DiaryView />}
      {view === "progress" && <ProgressView />}
      {view === "plan" && <PlanView />}
      {view === "reports" && <ReportsView />}
      {view === "profile" && <ProfileView />}
    </AppShell>
  );
}