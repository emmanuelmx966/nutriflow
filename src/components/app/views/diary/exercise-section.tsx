"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ExerciseLogEntry } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Flame, Clock, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { ExerciseAddDialog } from "./exercise-add-dialog";

export function ExerciseSection({ date }: { date: string }) {
  const qc = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard", date],
    queryFn: () =>
      api.get<{ exerciseLogs: ExerciseLogEntry[]; burned: number }>(
        `/api/stats?date=${date}`,
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/exercise/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", date] });
      toast.success("Ejercicio eliminado");
    },
    onError: () => toast.error("No se pudo eliminar"),
  });

  if (isLoading) return <ExerciseSkeleton />;

  const logs = (stats?.exerciseLogs as ExerciseLogEntry[]) ?? [];
  const burned = stats?.burned ?? 0;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-sky-500 to-cyan-600 text-white border-0">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-sky-50/90 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" /> Calorías quemadas
            </div>
            <div className="text-3xl font-bold tabular-nums mt-1">
              {Math.round(burned)}
            </div>
            <div className="text-xs text-sky-50/80">
              kcal · {logs.length}{" "}
              {logs.length === 1 ? "actividad" : "actividades"}
            </div>
          </div>
          <div className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center">
            <Dumbbell className="h-7 w-7" />
          </div>
        </CardContent>
      </Card>

      <ExerciseAddDialog date={date} />

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border/40">
            <div className="text-sm font-semibold">Actividades registradas</div>
          </div>
          {logs.length > 0 ? (
            <ul className="divide-y divide-border/40">
              {logs.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {l.exerciseName}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {Math.round(l.durationMin)}{" "}
                      min
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm font-semibold tabular-nums text-sky-600 dark:text-sky-400">
                      {Math.round(l.caloriesBurned)} kcal
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(l.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                Sin ejercicios registrados hoy
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Añade una actividad para registrar calorías quemadas
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExerciseSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}