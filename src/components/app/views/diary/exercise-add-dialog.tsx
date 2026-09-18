"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ExerciseItem } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ExerciseAddDialog({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ExerciseItem | null>(null);
  const [duration, setDuration] = useState(30);
  const [manualCals, setManualCals] = useState("");
  const qc = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ["exercise-search", query],
    queryFn: () =>
      api.get<ExerciseItem[]>(
        `/api/exercise?query=${encodeURIComponent(query)}&limit=20`,
      ),
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
      toast.success("Ejercicio registrado");
      setOpen(false);
      setQuery("");
      setSelected(null);
      setDuration(30);
      setManualCals("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setQuery("");
          setSelected(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full h-10">
          <Plus className="h-4 w-4 mr-1" /> Registrar ejercicio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Registrar ejercicio</DialogTitle>
        </DialogHeader>

        {!selected ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Buscar (correr, bicicleta, yoga...)"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto scroll-slim -mx-1 px-1 min-h-[200px]">
              {query.length <= 1 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Busca un ejercicio o escribe el tuyo
                </div>
              )}
              {query.length > 1 && isFetching && (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {query.length > 1 && !isFetching && (
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => setSelected(null)}
                      className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          "{query}" (propio)
                        </span>
                        <Plus className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Usar como nombre personalizado
                      </div>
                    </button>
                  </li>
                  {(data ?? []).map((ex) => (
                    <li key={ex.id}>
                      <button
                        onClick={() => {
                          setSelected(ex);
                        }}
                        className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">
                              {ex.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {ex.description}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 capitalize shrink-0"
                          >
                            {ex.category}
                          </Badge>
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
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ‹ Volver a búsqueda
            </button>
            <div>
              <div className="text-base font-semibold">{selected.name}</div>
              {selected.description && (
                <div className="text-xs text-muted-foreground">
                  {selected.description}
                </div>
              )}
              <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                {selected.category} · {selected.metValue} MET
              </Badge>
            </div>
          </div>
        )}

        {(selected || query) && (
          <div className="space-y-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label>Duración (minutos)</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setDuration(Math.max(5, duration - 5))}
                >
                  <span className="text-lg leading-none">−</span>
                </Button>
                <Input
                  type="number"
                  min="5"
                  step="5"
                  value={duration}
                  onChange={(e) =>
                    setDuration(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setDuration(duration + 5)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[15, 30, 45, 60, 90].map((d) => (
                  <Button
                    key={d}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 text-xs",
                      duration === d && "border-sky-500 text-sky-600",
                    )}
                    onClick={() => setDuration(d)}
                  >
                    {d}m
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Calorías (opcional — se calcula automáticamente)
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="Auto"
                value={manualCals}
                onChange={(e) => setManualCals(e.target.value)}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={
              addMutation.isPending || (!selected && !query) || duration < 1
            }
            className="w-full"
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Registrar {duration} min</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}