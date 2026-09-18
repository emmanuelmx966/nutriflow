"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ExerciseItem, type ExerciseLogEntry } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Loader2, Flame, Clock, Dumbbell } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { formatDateLabel, todayLocalString } from "@/lib/utils/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ExerciseView() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const prevDay = useAppStore((s) => s.prevDay);
  const nextDay = useAppStore((s) => s.nextDay);
  const qc = useQueryClient();
  const isToday = selectedDate === todayLocalString();

  // Fetch exercise logs for the day — reuse stats endpoint for burned + logs
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard", selectedDate],
    queryFn: () => api.get<{ exerciseLogs: ExerciseLogEntry[]; burned: number }>(`/api/stats?date=${selectedDate}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/exercise/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", selectedDate] });
      toast.success("Exercise removed");
    },
    onError: () => toast.error("Could not remove"),
  });

  if (isLoading) return <ExerciseSkeleton />;

  const logs = (stats?.exerciseLogs as ExerciseLogEntry[]) ?? [];
  const burned = stats?.burned ?? 0;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={prevDay}>‹</Button>
          <span className="text-sm font-semibold px-1">{formatDateLabel(selectedDate)}</span>
          <Button variant="ghost" size="sm" onClick={nextDay}>›</Button>
        </div>
        {!isToday && (
          <Button variant="outline" size="sm" onClick={() => useAppStore.getState().goToday()}>Today</Button>
        )}
      </div>

      <Card className="bg-gradient-to-br from-sky-500 to-cyan-600 text-white border-0">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-sky-50/90 flex items-center gap-1.5"><Flame className="h-3.5 w-3.5" /> Calories burned</div>
            <div className="text-3xl font-bold tabular-nums mt-1">{Math.round(burned)}</div>
            <div className="text-xs text-sky-50/80">kcal · {logs.length} {logs.length === 1 ? "activity" : "activities"}</div>
          </div>
          <div className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center">
            <Dumbbell className="h-7 w-7" />
          </div>
        </CardContent>
      </Card>

      <ExerciseAddDialog date={selectedDate} />

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border/40">
            <div className="text-sm font-semibold">Logged activities</div>
          </div>
          {logs.length > 0 ? (
            <ul className="divide-y divide-border/40">
              {logs.map((l) => (
                <li key={l.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{l.exerciseName}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {Math.round(l.durationMin)} min
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm font-semibold tabular-nums text-sky-600 dark:text-sky-400">{Math.round(l.caloriesBurned)} kcal</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(l.id)} aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">No exercises logged today</div>
              <div className="text-xs text-muted-foreground mt-1">Add an activity to track calories burned</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExerciseAddDialog({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ExerciseItem | null>(null);
  const [duration, setDuration] = useState(30);
  const [manualCals, setManualCals] = useState("");
  const qc = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ["exercise-search", query],
    queryFn: () => api.get<ExerciseItem[]>(`/api/exercise?query=${encodeURIComponent(query)}&limit=20`),
    enabled: query.length > 1 && open,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api.post("/api/exercise", {
        date: new Date(date + "T12:00:00").toISOString(),
        exerciseId: selected?.id,
        exerciseName: selected?.name ?? query,
        durationMin: duration,
        caloriesBurned: manualCals ? Number(manualCals) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", date] });
      toast.success("Exercise logged");
      setOpen(false);
      setQuery(""); setSelected(null); setDuration(30); setManualCals("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setQuery(""); setSelected(null); } }}>
      <DialogTrigger asChild>
        <Button className="w-full h-10"><Plus className="h-4 w-4 mr-1" /> Log exercise</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader><DialogTitle>Log exercise</DialogTitle></DialogHeader>

        {!selected ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input autoFocus placeholder="Search (running, cycling, yoga...)" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto scroll-slim -mx-1 px-1 min-h-[200px]">
              {query.length <= 1 && (
                <div className="py-12 text-center text-sm text-muted-foreground">Search for an exercise or type your own</div>
              )}
              {query.length > 1 && isFetching && (
                <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              )}
              {query.length > 1 && !isFetching && (
                <ul className="space-y-1">
                  <li>
                    <button onClick={() => setSelected(null)} className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">"{query}" (custom)</span>
                        <Plus className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="text-[11px] text-muted-foreground">Use as custom activity name</div>
                    </button>
                  </li>
                  {(data ?? []).map((ex) => (
                    <li key={ex.id}>
                      <button onClick={() => { setSelected(ex); }} className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{ex.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{ex.description}</div>
                          </div>
                          <Badge variant="outline" className="text-[9px] h-4 capitalize shrink-0">{ex.category}</Badge>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">‹ Back to search</button>
            <div>
              <div className="text-base font-semibold">{selected.name}</div>
              {selected.description && <div className="text-xs text-muted-foreground">{selected.description}</div>}
              <Badge variant="outline" className="text-[10px] mt-1 capitalize">{selected.category} · {selected.metValue} MET</Badge>
            </div>
          </div>
        )}

        {(selected || query) && (
          <div className="space-y-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setDuration(Math.max(5, duration - 5))}><span className="text-lg leading-none">−</span></Button>
                <Input type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))} className="text-center" />
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setDuration(duration + 5)}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[15, 30, 45, 60, 90].map((d) => (
                  <Button key={d} variant="outline" size="sm" className={cn("h-7 text-xs", duration === d && "border-sky-500 text-sky-600")} onClick={() => setDuration(d)}>{d}m</Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Calories (optional — auto-calculated if blank)</Label>
              <Input type="number" min="0" placeholder="Auto" value={manualCals} onChange={(e) => setManualCals(e.target.value)} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || (!selected && !query) || duration < 1} className="w-full">
            {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Log {duration} min</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExerciseSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
