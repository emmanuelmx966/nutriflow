"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type WeightLogEntry } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, TrendingDown, TrendingUp, Scale, Loader2, Activity } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";
import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart,
} from "recharts";
import { GoalPredictionCard } from "@/components/app/goal-prediction-card";
import { todayLocalString } from "@/lib/utils/date";

export function ProgressView() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const [range, setRange] = useState(30);
  const [open, setOpen] = useState(false);

  const { data: weights, isLoading } = useQuery({
    queryKey: ["weight-history", range],
    queryFn: () => api.get<WeightLogEntry[]>(`/api/weight?days=${range}`),
  });

  const chartData = (weights ?? []).map((w) => ({
    date: new Date(w.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    weight: w.weightKg,
  }));

  const latest = weights?.[weights.length - 1];
  const first = weights?.[0];
  const change = latest && first ? latest.weightKg - first.weightKg : 0;
  const down = change < 0;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Progress</h2>
        <AddWeightDialog open={open} onOpenChange={setOpen} date={selectedDate} />
      </div>

      {/* Weight summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Scale className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground">Current</div>
            <div className="text-base font-bold tabular-nums">{latest ? latest.weightKg.toFixed(1) : "—"}<span className="text-[10px] font-normal text-muted-foreground"> kg</span></div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            {down ? <TrendingDown className="h-4 w-4 text-emerald-500 mx-auto mb-1" /> : <TrendingUp className="h-4 w-4 text-orange-500 mx-auto mb-1" />}
            <div className="text-[10px] text-muted-foreground">{range}d change</div>
            <div className={`text-base font-bold tabular-nums ${down ? "text-emerald-600" : "text-orange-600"}`}>{change >= 0 ? "+" : ""}{change.toFixed(1)}<span className="text-[10px] font-normal text-muted-foreground"> kg</span></div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <Activity className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground">Entries</div>
            <div className="text-base font-bold tabular-nums">{weights?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Range selector */}
      <div className="flex gap-1.5">
        {[7, 30, 90].map((r) => (
          <Button key={r} variant={range === r ? "default" : "outline"} size="sm" className={`h-8 flex-1 text-xs ${range === r ? "" : "text-muted-foreground"}`} onClick={() => setRange(r)}>
            {r} days
          </Button>
        ))}
      </div>

      {/* Goal prediction */}
      <GoalPredictionCard />

      {/* Weight chart */}
      <Card className="border-border/60">
        <CardHeader className="pb-1 pt-4"><CardTitle className="text-sm font-medium text-muted-foreground">Weight trend</CardTitle></CardHeader>
        <CardContent className="pb-4">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-sm text-muted-foreground">
              <Scale className="h-8 w-8 text-muted-foreground/40 mb-2" />
              No weight entries yet
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "currentColor" }} className="text-muted-foreground" tickLine={false} axisLine={false} width={36} />
                  <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid var(--border)", fontSize: "12px" }} formatter={(v: number) => [`${v} kg`, "Weight"]} />
                  <Area type="monotone" dataKey="weight" stroke="var(--primary)" strokeWidth={2} fill="url(#weightGrad)" dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent entries */}
      <Card className="border-border/60">
        <CardHeader className="pb-1 pt-4"><CardTitle className="text-sm font-medium text-muted-foreground">Recent weigh-ins</CardTitle></CardHeader>
        <CardContent className="pb-2">
          {weights && weights.length > 0 ? (
            <ul className="divide-y divide-border/40">
              {[...weights].reverse().slice(0, 8).map((w) => (
                <li key={w.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium">{w.weightKg.toFixed(1)} kg</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(w.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                  </div>
                  {w.note && <span className="text-xs text-muted-foreground truncate max-w-[50%]">{w.note}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">Log your first weigh-in to see trends</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AddWeightDialog({ open, onOpenChange, date }: { open: boolean; onOpenChange: (o: boolean) => void; date: string }) {
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: () => api.post("/api/weight", { date: new Date(date + "T08:00:00").toISOString(), weightKg: Number(weight), note: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight-history"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Weight logged");
      onOpenChange(false);
      setWeight(""); setNote("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Log weight</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Log weight</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input type="number" step="0.1" min="30" max="300" autoFocus placeholder="e.g. 72.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Input placeholder="e.g. After morning run" value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => add.mutate()} disabled={add.isPending || !weight} className="w-full">
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
