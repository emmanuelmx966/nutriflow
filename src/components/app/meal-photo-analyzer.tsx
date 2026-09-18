"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, type MealAnalysisResult, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Loader2, Sparkles, Check, X, ImageIcon, AlertCircle } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

interface MealPhotoAnalyzerProps {
  meal?: Meal;
  date?: string;
}

/**
 * MealPhotoAnalyzer — AI-powered meal photo recognition (MFP premium feature).
 * Lets users snap/upload a meal photo; the VLM identifies foods + estimates
 * nutrition. User reviews and logs in one tap.
 */
export function MealPhotoAnalyzer({ meal: defaultMeal = "lunch", date }: MealPhotoAnalyzerProps) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MealAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meal, setMeal] = useState<Meal>(defaultMeal);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const storeDate = useAppStore((s) => s.selectedDate);
  const selectedDate = date ?? storeDate;

  function reset() {
    setImage(null);
    setResult(null);
    setError(null);
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Image too large (max 6MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setError(null);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!image) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await api.post<MealAnalysisResult>("/api/ai/analyze-meal", { image });
      setResult(res);
      setMeal(res.mealType);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "RATE_LIMITED") {
          setError("You've reached the AI analysis limit (10/hour). Try again later.");
        } else if (e.code === "ANALYSIS_FAILED") {
          setError("Couldn't analyze this photo. Try a clearer, well-lit image of your meal.");
        } else if (e.code === "IMAGE_TOO_LARGE") {
          setError("Image too large. Please use a smaller photo.");
        } else {
          setError(e.message);
        }
      } else {
        setError("Analysis failed. Please try again.");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function logAll() {
    if (!result) return;
    const dateStr = new Date(selectedDate + "T12:00:00").toISOString();
    let added = 0;
    for (const food of result.foods) {
      try {
        // Create a custom food for the analyzed item, then log it
        const customFood = await api.post<{ id: string }>("/api/foods", {
          name: food.name,
          category: "ai-analyzed",
          servingDesc: `${food.portionGrams}g`,
          caloriesPer100g: Math.round((food.calories / food.portionGrams) * 100),
          proteinPer100g: Math.round((food.proteinG / food.portionGrams) * 1000) / 10,
          carbsPer100g: Math.round((food.carbsG / food.portionGrams) * 1000) / 10,
          fatPer100g: Math.round((food.fatG / food.portionGrams) * 1000) / 10,
          defaultServingG: food.portionGrams,
        });
        await api.post("/api/diary", {
          date: dateStr,
          meal,
          customFoodId: customFood.id,
          quantityG: food.portionGrams,
        });
        added++;
      } catch {
        // continue even if one fails
      }
    }
    if (added > 0) {
      qc.invalidateQueries({ queryKey: ["diary", selectedDate] });
      qc.invalidateQueries({ queryKey: ["dashboard", selectedDate] });
      toast.success(`Logged ${added} food${added === 1 ? "" : "s"} from photo`);
      setOpen(false);
      reset();
    } else {
      toast.error("Could not log foods from photo");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="bg-violet-gradient text-white">
          <Sparkles className="h-4 w-4 mr-1" /> Snap meal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto scroll-slim">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" /> AI meal analyzer
          </DialogTitle>
        </DialogHeader>

        {!image && (
          <div className="space-y-3">
            <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200/50 dark:border-violet-900/50 p-3 text-xs text-violet-700 dark:text-violet-400">
              Snap or upload a photo of your meal. AI will identify the foods and estimate calories + macros automatically.
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-20 flex-col gap-1.5" onClick={() => cameraInputRef.current?.click()}>
                <Camera className="h-6 w-6" />
                <span className="text-xs">Take photo</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-1.5" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-6 w-6" />
                <span className="text-xs">Upload</span>
              </Button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}
          </div>
        )}

        {image && !result && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-muted">
              {/* img element is intentional for data-URL preview */}
              <img src={image} alt="Meal preview" className="w-full max-h-64 object-cover" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => setImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}
            <Button onClick={analyze} disabled={analyzing} className="w-full bg-violet-gradient text-white">
              {analyzing ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1" /> Analyze meal</>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              {analyzing ? "Identifying foods and estimating nutrition..." : "AI vision powered — estimates are approximate"}
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {result.summary && (
              <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200/50 dark:border-violet-900/50 p-3">
                <div className="text-xs font-medium text-violet-700 dark:text-violet-400 mb-0.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI summary
                </div>
                <p className="text-sm">{result.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 rounded-xl bg-accent/40 p-3 text-center">
              <div>
                <div className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">{result.totalCalories}</div>
                <div className="text-[10px] text-muted-foreground">kcal</div>
              </div>
              <div>
                <div className="text-lg font-bold tabular-nums">{Math.round(result.totalProtein)}g</div>
                <div className="text-[10px] text-muted-foreground">protein</div>
              </div>
              <div>
                <div className="text-lg font-bold tabular-nums">{Math.round(result.totalCarbs)}g</div>
                <div className="text-[10px] text-muted-foreground">carbs</div>
              </div>
              <div>
                <div className="text-lg font-bold tabular-nums">{Math.round(result.totalFat)}g</div>
                <div className="text-[10px] text-muted-foreground">fat</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Identified foods ({result.foods.length})</div>
              <ul className="space-y-1">
                {result.foods.map((f, i) => (
                  <li key={i} className="rounded-lg bg-accent/30 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{f.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {f.portionGrams}g · {Math.round(f.calories)} kcal · P{Math.round(f.proteinG)} C{Math.round(f.carbsG)} F{Math.round(f.fatG)}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] h-5 shrink-0",
                          f.confidence >= 0.7 ? "border-emerald-300 text-emerald-600 dark:text-emerald-400" : "border-amber-300 text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {Math.round(f.confidence * 100)}%
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label>Log to meal</Label>
              <Select value={meal} onValueChange={(v) => setMeal(v as Meal)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                <ImageIcon className="h-4 w-4 mr-1" /> New photo
              </Button>
              <Button onClick={logAll} className="flex-1 bg-violet-gradient text-white">
                <Check className="h-4 w-4 mr-1" /> Log all
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Logged foods are saved as custom foods for future use
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
