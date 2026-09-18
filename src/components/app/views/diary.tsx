"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type FoodItem, type FoodSearchResult, type DiaryDay, type CustomFoodItem } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Trash2, Loader2, Coffee, Sun, Moon, Cookie, Package } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { formatDateLabel, todayLocalString } from "@/lib/utils/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BarcodeScanner } from "@/components/app/barcode-scanner";
import { MealPhotoAnalyzer } from "@/components/app/meal-photo-analyzer";
import { FoodAutocomplete } from "@/components/app/food-autocomplete";

const MEALS = [
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "lunch", label: "Lunch", icon: Sun },
  { id: "dinner", label: "Dinner", icon: Moon },
  { id: "snack", label: "Snacks", icon: Cookie },
] as const;

type MealId = (typeof MEALS)[number]["id"];

export function DiaryView() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const prevDay = useAppStore((s) => s.prevDay);
  const nextDay = useAppStore((s) => s.nextDay);
  const qc = useQueryClient();
  const isToday = selectedDate === todayLocalString();

  const { data: day, isLoading } = useQuery({
    queryKey: ["diary", selectedDate],
    queryFn: () => api.get<DiaryDay>(`/api/diary?date=${selectedDate}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/diary/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", selectedDate] });
      qc.invalidateQueries({ queryKey: ["dashboard", selectedDate] });
      toast.success("Removed from diary");
    },
    onError: () => toast.error("Could not remove item"),
  });

  if (isLoading) return <DiarySkeleton />;

  const logs = day?.logs ?? [];
  const totals = day?.consumed ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={prevDay}>‹</Button>
          <span className="text-sm font-semibold px-1">{formatDateLabel(selectedDate)}</span>
          <Button variant="ghost" size="sm" onClick={nextDay}>›</Button>
        </div>
        <div className="flex items-center gap-2">
          <MealPhotoAnalyzer date={selectedDate} />
          {!isToday && (
            <Button variant="outline" size="sm" onClick={() => useAppStore.getState().goToday()}>Today</Button>
          )}
        </div>
      </div>

      {/* Day totals banner */}
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0">
        <CardContent className="p-4 flex items-center justify-around text-center">
          <div>
            <div className="text-2xl font-bold tabular-nums">{Math.round(totals.calories)}</div>
            <div className="text-[11px] text-emerald-50/90">kcal</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <div className="text-lg font-semibold tabular-nums">{Math.round(totals.protein)}</div>
            <div className="text-[11px] text-emerald-50/90">protein g</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <div className="text-lg font-semibold tabular-nums">{Math.round(totals.carbs)}</div>
            <div className="text-[11px] text-emerald-50/90">carbs g</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <div className="text-lg font-semibold tabular-nums">{Math.round(totals.fat)}</div>
            <div className="text-[11px] text-emerald-50/90">fat g</div>
          </div>
        </CardContent>
      </Card>

      {/* Quick food search autocomplete */}
      <FoodAutocomplete meal="snack" date={selectedDate} />

      {/* Meal sections */}
      {MEALS.map((meal) => {
        const mealLogs = logs.filter((l) => l.meal === meal.id);
        const mealCals = mealLogs.reduce((s, l) => s + l.calories, 0);
        const Icon = meal.icon;
        return (
          <Card key={meal.id} className="border-border/60">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                    <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{meal.label}</div>
                    <div className="text-[11px] text-muted-foreground">{Math.round(mealCals)} kcal</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <BarcodeScanner meal={meal.id} date={selectedDate} />
                  <FoodSearchDialog meal={meal.id} date={selectedDate} />
                </div>
              </div>
              {mealLogs.length > 0 ? (
                <ul className="divide-y divide-border/40">
                  {mealLogs.map((l) => (
                    <li key={l.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{l.foodName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {Math.round(l.quantityG)}g · {l.servings.toFixed(1)} serv · P{Math.round(l.protein)} C{Math.round(l.carbs)} F{Math.round(l.fat)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm font-semibold tabular-nums">{Math.round(l.calories)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate(l.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-3 text-xs text-muted-foreground">No items logged</div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Create custom food */}
      <CustomFoodCreator onCreated={() => toast.success("Custom food created")} />
    </div>
  );
}

function FoodSearchDialog({ meal, date }: { meal: MealId; date: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | CustomFoodItem | null>(null);
  const [servings, setServings] = useState(1);
  const qc = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ["food-search", query],
    queryFn: () => api.get<FoodSearchResult>(`/api/foods?query=${encodeURIComponent(query)}&limit=20`),
    enabled: query.length > 1 && open,
  });

  const addMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("No food selected");
      const isCustom = "userId" in selected;
      return api.post("/api/diary", {
        date: new Date(date + "T12:00:00").toISOString(),
        meal,
        foodId: isCustom ? undefined : selected.id,
        customFoodId: isCustom ? selected.id : undefined,
        quantityG: Math.round(servings * selected.defaultServingG),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", date] });
      qc.invalidateQueries({ queryKey: ["dashboard", date] });
      toast.success("Added to diary");
      setOpen(false);
      setQuery("");
      setSelected(null);
      setServings(1);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add"),
  });

  const results = [...(data?.foods ?? []), ...(data?.custom ?? [])];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setQuery(""); setSelected(null); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 gap-1 text-emerald-600 dark:text-emerald-400">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="capitalize">Add to {meal}</DialogTitle>
        </DialogHeader>

        {!selected ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search foods (e.g. apple, chicken, big mac)..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto scroll-slim -mx-1 px-1 min-h-[200px]">
              {query.length <= 1 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </div>
              )}
              {query.length > 1 && isFetching && (
                <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              )}
              {query.length > 1 && !isFetching && results.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No foods found. Try a different search.
                </div>
              )}
              <ul className="space-y-1">
                {results.map((f) => (
                  <li key={("userId" in f ? "c-" : "f-") + f.id}>
                    <button
                      onClick={() => { setSelected(f); setServings(1); }}
                      className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{f.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {f.servingDesc} · {Math.round(f.caloriesPer100g * f.defaultServingG / 100)} kcal
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {"userId" in f && <Badge variant="secondary" className="text-[9px] h-4">custom</Badge>}
                          <Badge variant="outline" className="text-[9px] h-4 capitalize">{f.category}</Badge>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <FoodDetail
            food={selected}
            servings={servings}
            setServings={setServings}
            onBack={() => setSelected(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FoodDetail({
  food,
  servings,
  setServings,
  onBack,
}: {
  food: FoodItem | CustomFoodItem;
  servings: number;
  setServings: (n: number) => void;
  onBack: () => void;
}) {
  const grams = Math.round(servings * food.defaultServingG);
  const factor = grams / 100;
  const cal = Math.round(food.caloriesPer100g * factor);
  const p = Math.round(food.proteinPer100g * factor * 10) / 10;
  const c = Math.round(food.carbsPer100g * factor * 10) / 10;
  const f = Math.round(food.fatPer100g * factor * 10) / 10;

  const presets = [0.5, 1, 1.5, 2, 3];

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">‹ Back to search</button>
      <div>
        <div className="text-base font-semibold">{food.name}</div>
        {food.brand && <div className="text-xs text-muted-foreground">{food.brand}</div>}
        <div className="text-xs text-muted-foreground mt-0.5">{food.servingDesc}</div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-xl bg-accent/40 p-3 text-center">
        <div><div className="text-lg font-bold tabular-nums">{cal}</div><div className="text-[10px] text-muted-foreground">kcal</div></div>
        <div><div className="text-lg font-bold tabular-nums">{p}g</div><div className="text-[10px] text-muted-foreground">protein</div></div>
        <div><div className="text-lg font-bold tabular-nums">{c}g</div><div className="text-[10px] text-muted-foreground">carbs</div></div>
        <div><div className="text-lg font-bold tabular-nums">{f}g</div><div className="text-[10px] text-muted-foreground">fat</div></div>
      </div>

      <div className="space-y-2">
        <Label>Servings ({grams}g)</Label>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setServings(Math.max(0.25, Math.round((servings - 0.25) * 100) / 100))}>
            <span className="text-lg leading-none">−</span>
          </Button>
          <Input
            type="number"
            step="0.25"
            min="0.25"
            value={servings}
            onChange={(e) => setServings(Math.max(0.25, parseFloat(e.target.value) || 0.25))}
            className="text-center"
          />
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setServings(Math.round((servings + 0.25) * 100) / 100)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <Button key={p} variant="outline" size="sm" className={cn("h-7 text-xs", servings === p && "border-emerald-500 text-emerald-600")} onClick={() => setServings(p)}>
              {p}×
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomFoodCreator({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", brand: "", category: "custom",
    caloriesPer100g: "", proteinPer100g: "", carbsPer100g: "", fatPer100g: "",
    defaultServingG: "100", servingDesc: "1 serving",
  });

  const create = useMutation({
    mutationFn: () =>
      api.post("/api/foods", {
        name: form.name,
        brand: form.brand || undefined,
        category: form.category,
        servingDesc: form.servingDesc,
        caloriesPer100g: Number(form.caloriesPer100g),
        proteinPer100g: Number(form.proteinPer100g),
        carbsPer100g: Number(form.carbsPer100g),
        fatPer100g: Number(form.fatPer100g),
        defaultServingG: Number(form.defaultServingG),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["food-search"] });
      onCreated();
      setOpen(false);
      setForm({ name: "", brand: "", category: "custom", caloriesPer100g: "", proteinPer100g: "", carbsPer100g: "", fatPer100g: "", defaultServingG: "100", servingDesc: "1 serving" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-9 text-sm">
          <Package className="h-4 w-4 mr-1.5" /> Create custom food
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto scroll-slim">
        <DialogHeader><DialogTitle>Create custom food</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My homemade granola" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Brand (optional)</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Serving desc</Label>
              <Input value={form.servingDesc} onChange={(e) => setForm({ ...form, servingDesc: e.target.value })} />
            </div>
          </div>
          <div className="text-xs font-medium text-muted-foreground pt-1">Nutrition per 100g</div>
          <div className="grid grid-cols-2 gap-2">
            <NumField label="Calories" value={form.caloriesPer100g} onChange={(v) => setForm({ ...form, caloriesPer100g: v })} />
            <NumField label="Default serving (g)" value={form.defaultServingG} onChange={(v) => setForm({ ...form, defaultServingG: v })} />
            <NumField label="Protein (g)" value={form.proteinPer100g} onChange={(v) => setForm({ ...form, proteinPer100g: v })} />
            <NumField label="Carbs (g)" value={form.carbsPer100g} onChange={(v) => setForm({ ...form, carbsPer100g: v })} />
            <NumField label="Fat (g)" value={form.fatPer100g} onChange={(v) => setForm({ ...form, fatPer100g: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={create.isPending || !form.name || !form.caloriesPer100g} className="w-full">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create food"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function DiarySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-20 w-full rounded-xl" />
      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );
}
