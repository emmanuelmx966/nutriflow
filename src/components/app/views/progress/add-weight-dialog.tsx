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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AddWeightDialog({
  open,
  onOpenChange,
  date,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: string;
}) {
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: () =>
      api.post("/api/weight", {
        date: new Date(date + "T08:00:00").toISOString(),
        weightKg: Number(weight),
        note: note || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight-history"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["prediction"] });
      toast.success("Peso registrado");
      onOpenChange(false);
      setWeight("");
      setNote("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Registrar peso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar peso</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Peso (kg)</Label>
            <Input
              type="number"
              step="0.1"
              min="30"
              max="300"
              autoFocus
              placeholder="ej. 72.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nota (opcional)</Label>
            <Input
              placeholder="ej. Después de correr"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => add.mutate()}
            disabled={add.isPending || !weight}
            className="w-full"
          >
            {add.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}