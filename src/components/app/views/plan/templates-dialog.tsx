"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type MealPlanTemplate } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LayoutTemplate, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TemplatesDialog({ weekStart }: { weekStart: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ["meal-plan-templates"],
    queryFn: () => api.get<MealPlanTemplate[]>("/api/meal-plan/templates"),
  });

  const applyMutation = useMutation({
    mutationFn: (templateId: string) =>
      api.post<{ planned: number }>("/api/meal-plan/templates", {
        templateId,
        week: weekStart,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", weekStart] });
      toast.success(`Plantilla aplicada: ${data.planned} comidas`);
      setOpen(false);
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Error";
      toast.error(
        msg.includes("NO_RECIPES")
          ? "Crea o marca como favoritas algunas recetas primero"
          : msg,
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <LayoutTemplate className="h-4 w-4 mr-1" /> Plantillas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto scroll-slim">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-emerald-500" /> Plantillas de
            plan
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Plantillas semanales pre-armadas usando tus recetas guardadas. Las
            comidas se aplican solo en celdas vacías, sin sobrescribir tu plan
            existente.
          </p>
          {(templates ?? []).map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyMutation.mutate(tpl.id)}
              disabled={applyMutation.isPending}
              className="group w-full text-left rounded-xl border border-border/60 p-3 hover:border-emerald-400 hover:bg-accent/40 transition-all"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-2xl shrink-0">{tpl.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{tpl.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {tpl.targetCalories}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    {tpl.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {tpl.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[8px] h-4 capitalize"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {!templates && (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}