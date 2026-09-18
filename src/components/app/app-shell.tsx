"use client";

import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  CalendarDays,
  FileText,
  User,
  LogOut,
  Moon,
  Sun,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore, type ViewName } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MilestoneNotifier } from "@/components/app/milestone-notifier";

interface NavItem {
  id: ViewName;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Hoy", icon: LayoutDashboard },
  { id: "diary", label: "Diario", icon: BookOpen },
  { id: "progress", label: "Progreso", icon: TrendingUp },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "reports", label: "Reportes", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  const initials = (session?.user?.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg pt-safe">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button
            onClick={() => setView("dashboard")}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm">
              <Leaf className="h-4 w-4 text-white" />
            </span>
            <span className="font-bold tracking-tight text-foreground">NutriFlow</span>
          </button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Cambiar tema"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Menú de cuenta"
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold dark:bg-emerald-900/40 dark:text-emerald-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  <div className="font-medium truncate">{session?.user?.name}</div>
                  <div className="text-xs font-normal text-muted-foreground truncate">
                    {session?.user?.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setView("profile")}>
                  <User className="mr-2 h-4 w-4" /> Mi perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    signOut({ redirect: false });
                    toast.success("Sesión cerrada");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Milestone unlock notifications (global) */}
      <MilestoneNotifier />

      {/* Main scrollable content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 pb-32 pt-5 scroll-slim">
        {children}
      </main>

      {/* Bottom navigation (mobile-first PWA) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-lg pb-safe">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                    active && "bg-emerald-100 dark:bg-emerald-900/30",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}