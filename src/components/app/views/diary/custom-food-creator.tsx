"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CustomFoodCreator({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "custom",
    caloriesPer100g: "",
    proteinPer100g: "",
    carbsPer100g: "",
    fatPer100g: "",
    defaultServingG: "100",
    servingDesc: "1 porción",
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
      setForm({
        name: "",
        brand: "",
        category: "custom",
        caloriesPer100g: "",
        proteinPer100g: "",
        carbsPer100g: "",
        fatPer100g: "",
        defaultServingG: "100",
        servingDesc: "1 porción",
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-9 text-sm">
          <Package className="h-4 w-4 mr-1.5" /> Crear alimento personalizado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto scroll-slim">
        <DialogHeader>
          <DialogTitle>Crear alimento personalizado</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mi granola casera"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Marca (opcional)</Label>
              <Input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción porción</Label>
              <Input
                value={form.servingDesc}
                onChange={(e) =>
                  setForm({ ...form, servingDesc: e.target.value })
                }
              />
            </div>
          </div>
          <div className="text-xs font-medium text-muted-foreground pt-1">
            Nutrición por 100g
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumField
              label="Calorías"
              value={form.caloriesPer100g}
              onChange={(v) => setForm({ ...form, caloriesPer100g: v })}
            />
            <NumField
              label="Porción por defecto (g)"
              value={form.defaultServingG}
              onChange={(v) => setForm({ ...form, defaultServingG: v })}
            />
            <NumField
              label="Proteína (g)"
              value={form.proteinPer100g}
              onChange={(v) => setForm({ ...form, proteinPer100g: v })}
            />
            <NumField
              label="Carbos (g)"
              value={form.carbsPer100g}
              onChange={(v) => setForm({ ...form, carbsPer100g: v })}
            />
            <NumField
              label="Grasa (g)"
              value={form.fatPer100g}
              onChange={(v) => setForm({ ...form, fatPer100g: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !form.name || !form.caloriesPer100g}
            className="w-full"
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Crear alimento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}