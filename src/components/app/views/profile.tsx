"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type UserProfile, type Goal, type FastSession } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Target, TimerReset, Play, Square, ShieldCheck, Mail, User as UserIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { calcAge, estimateGoals } from "@/lib/nutrition/calculator";
import { ImportDialog } from "@/components/app/import-dialog";

export function ProfileView() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<UserProfile>("/api/profile"),
  });

  const { data: goals } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.get<{ active: Goal | null; history: Goal[] }>("/api/goals"),
  });

  if (isLoading || !profile) return <ProfileSkeleton />;

  const activeGoal = goals?.active;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <h2 className="text-lg font-bold">Profile & Goals</h2>

      <Card className="border-border/60">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{profile.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Mail className="h-3 w-3" /> {profile.email}</div>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Member since {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })} · secured with bcrypt
          </div>
        </CardContent>
      </Card>

      {/* Data portability */}
      <Card className="border-border/60">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Your data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          <p className="text-xs text-muted-foreground">
            Export your data for backup or migration, or import from a previous export.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => { window.location.href = "/api/export?format=json"; }}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export JSON
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => { window.location.href = "/api/export?format=csv"; }}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
          </div>
          <ImportDialog />
        </CardContent>
      </Card>

      <ProfileForm key={profile.id} profile={profile} />

      <Card className="border-border/60">
        <CardHeader className="pb-2 pt-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5"><Target className="h-4 w-4 text-emerald-500" /> Daily goals</CardTitle>
          {activeGoal && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Active</Badge>}
        </CardHeader>
        <CardContent className="space-y-3">
          {activeGoal ? (
            <div className="grid grid-cols-2 gap-2">
              <GoalTile label="Calories" value={activeGoal.calorieGoal} unit="kcal" />
              <GoalTile label="Protein" value={activeGoal.proteinGoalG} unit="g" />
              <GoalTile label="Carbs" value={activeGoal.carbGoalG} unit="g" />
              <GoalTile label="Fat" value={activeGoal.fatGoalG} unit="g" />
              <GoalTile label="Water" value={activeGoal.waterGoalMl} unit="ml" />
              {activeGoal.weightGoalKg && <GoalTile label="Target weight" value={activeGoal.weightGoalKg} unit="kg" />}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-2">Complete your profile to auto-calculate goals.</div>
          )}
          <ManualGoals />
        </CardContent>
      </Card>

      <FastingCard />
    </div>
  );
}

/**
 * Editable biometric form — keyed by profile.id so state initializes
 * directly from props (no useEffect needed → compliant with React rules).
 */
function ProfileForm({ profile }: { profile: UserProfile }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: profile.name ?? "",
    gender: profile.gender ?? "",
    birthDate: profile.birthDate ? profile.birthDate.split("T")[0] : "",
    heightCm: profile.heightCm?.toString() ?? "",
    weightKg: profile.weightKg?.toString() ?? "",
    activityLevel: profile.activityLevel ?? "",
    goalType: profile.goalType ?? "",
    weeklyGoalKg: profile.weeklyGoalKg?.toString() ?? "0.5",
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {};
      body.name = form.name;
      if (form.gender) body.gender = form.gender;
      if (form.birthDate) body.birthDate = new Date(form.birthDate + "T00:00:00").toISOString();
      if (form.heightCm) body.heightCm = Number(form.heightCm);
      if (form.weightKg) body.weightKg = Number(form.weightKg);
      if (form.activityLevel) body.activityLevel = form.activityLevel;
      if (form.goalType) body.goalType = form.goalType;
      body.weeklyGoalKg = Number(form.weeklyGoalKg || 0.5);
      return api.patch("/api/profile", body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Profile saved · goals recalculated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const preview = (() => {
    if (!form.gender || !form.birthDate || !form.heightCm || !form.weightKg || !form.activityLevel || !form.goalType) return null;
    return estimateGoals({
      gender: form.gender as "male" | "female",
      weightKg: Number(form.weightKg),
      heightCm: Number(form.heightCm),
      ageYears: calcAge(new Date(form.birthDate + "T00:00:00")),
      activity: form.activityLevel as never,
      goal: form.goalType as "lose" | "maintain" | "gain",
      weeklyGoalKg: Number(form.weeklyGoalKg || 0.5),
    });
  })();

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Your details</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date of birth</Label>
            <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Height (cm)</Label>
            <Input type="number" min="80" max="250" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input type="number" step="0.1" min="30" max="300" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Activity level</Label>
          <Select value={form.activityLevel} onValueChange={(v) => setForm({ ...form, activityLevel: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
              <SelectItem value="light">Lightly active (1-3 days/wk)</SelectItem>
              <SelectItem value="moderate">Moderately active (3-5 days/wk)</SelectItem>
              <SelectItem value="active">Very active (6-7 days/wk)</SelectItem>
              <SelectItem value="very_active">Extra active (physical job)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Goal</Label>
            <Select value={form.goalType} onValueChange={(v) => setForm({ ...form, goalType: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lose">Lose weight</SelectItem>
                <SelectItem value="maintain">Maintain</SelectItem>
                <SelectItem value="gain">Gain weight</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Weekly target (kg)</Label>
            <Input type="number" step="0.1" min="0.1" max="2" value={form.weeklyGoalKg} onChange={(e) => setForm({ ...form, weeklyGoalKg: e.target.value })} />
          </div>
        </div>

        {preview && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50 p-3">
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Calculated targets</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><div className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{preview.calorieGoal}</div><div className="text-[10px] text-muted-foreground">kcal/day</div></div>
              <div><div className="text-base font-bold tabular-nums">{preview.proteinG}g</div><div className="text-[10px] text-muted-foreground">protein</div></div>
              <div><div className="text-base font-bold tabular-nums">{preview.carbG}g</div><div className="text-[10px] text-muted-foreground">carbs</div></div>
              <div><div className="text-base font-bold tabular-nums">{preview.fatG}g</div><div className="text-[10px] text-muted-foreground">fat</div></div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5 text-center">BMR {preview.bmr} · TDEE {preview.tdee} · Water {preview.waterGoalMl}ml</div>
          </div>
        )}

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save profile
        </Button>
      </CardContent>
    </Card>
  );
}

function GoalTile({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-lg bg-accent/40 p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-base font-bold tabular-nums">{Math.round(value * 10) / 10}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span></div>
    </div>
  );
}

function ManualGoals() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cal, setCal] = useState("2000");
  const [p, setP] = useState("120");
  const [c, setC] = useState("220");
  const [f, setF] = useState("65");
  const [w, setW] = useState("2000");

  const save = useMutation({
    mutationFn: () => api.post("/api/goals", { calorieGoal: Number(cal), proteinGoalG: Number(p), carbGoalG: Number(c), fatGoalG: Number(f), waterGoalMl: Number(w) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Goals updated");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (!open) {
    return <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>Customize goals manually</Button>;
  }

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Calories" value={cal} onChange={setCal} />
        <NumField label="Water (ml)" value={w} onChange={setW} />
        <NumField label="Protein (g)" value={p} onChange={setP} />
        <NumField label="Carbs (g)" value={c} onChange={setC} />
        <NumField label="Fat (g)" value={f} onChange={setF} />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="flex-1">
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save goals"}
        </Button>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FastingCard() {
  const qc = useQueryClient();
  const [protocol, setProtocol] = useState(16);

  const { data } = useQuery({
    queryKey: ["fasting"],
    queryFn: () => api.get<{ current: FastSession | null; history: FastSession[] }>("/api/fasting"),
  });

  const start = useMutation({
    mutationFn: () => api.post("/api/fasting", { protocolHours: protocol }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fasting"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Fast started · ${protocol}:8 protocol`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const stop = useMutation({
    mutationFn: () => api.del("/api/fasting"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fasting"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Fast ended");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const current = data?.current;
  const history = data?.history ?? [];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm flex items-center gap-1.5"><TimerReset className="h-4 w-4 text-indigo-500" /> Intermittent fasting</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {current ? (
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" /> Fasting · {current.protocolHours}:8</div>
                <div className="text-xl font-bold mt-0.5 tabular-nums">{formatElapsed(current.startTime)}</div>
                <div className="text-[10px] text-muted-foreground">Started {new Date(current.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
            <Button onClick={() => stop.mutate()} disabled={stop.isPending} variant="outline" className="w-full mt-3 text-indigo-600 border-indigo-300 dark:border-indigo-700">
              <Square className="h-3.5 w-3.5 mr-1" /> End fast
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>Protocol</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {[16, 18, 20, 24].map((h) => (
                  <Button key={h} variant={protocol === h ? "default" : "outline"} size="sm" className="h-9 text-xs" onClick={() => setProtocol(h)}>
                    {h}:8
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={() => start.mutate()} disabled={start.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {start.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-1" />} Start fast
            </Button>
          </>
        )}

        {history.length > 0 && (
          <>
            <Separator />
            <div className="text-xs font-medium text-muted-foreground">Recent fasts</div>
            <ul className="space-y-1">
              {history.slice(0, 5).map((f) => (
                <li key={f.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{new Date(f.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  <span className="font-medium">{f.endTime ? formatDuration(f.startTime, f.endTime) : "—"}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatElapsed(start: string): string {
  const ms = Date.now() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
