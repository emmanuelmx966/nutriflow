"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, type ImportResult, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Upload, Loader2, CheckCircle2, AlertCircle, FileJson } from "lucide-react";
import { toast } from "sonner";

/**
 * ImportDialog — import data from a NutriFlow JSON export.
 * Complements the Export feature for user migration/backup restore.
 */
export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  async function handleFile(file: File) {
    setFileName(file.name);
    setError(null);
    setResult(null);
    if (!file.name.endsWith(".json")) {
      setError("Please select a JSON file exported from NutriFlow");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB)");
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await api.post<ImportResult>("/api/import", data);
      setResult(res);
      toast.success(`Imported ${res.imported.foodLogs + res.imported.weightLogs + res.imported.recipes} records`);
      qc.invalidateQueries({ queryKey: ["diary"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["recipes"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError("Invalid JSON file. Please check the file is a valid NutriFlow export.");
      } else if (e instanceof ApiError) {
        if (e.code === "INVALID_FORMAT") {
          setError("This file isn't a valid NutriFlow export. The format doesn't match.");
        } else {
          setError(e.message);
        }
      } else {
        setError("Import failed. Please try again.");
      }
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setFileName(null);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="h-4 w-4 mr-1.5" /> Import data (JSON)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-emerald-500" /> Import data
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50 p-3 text-xs text-emerald-700 dark:text-emerald-400">
            Import your data from a previously exported NutriFlow JSON file. This restores food logs, weight history, water logs, exercises, recipes, and goals.
          </div>

          {!result && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-border/60 py-8 flex flex-col items-center gap-2 hover:bg-accent/40 transition-colors"
              >
                <FileJson className="h-8 w-8 text-muted-foreground/50" />
                <span className="text-sm font-medium">
                  {fileName ?? "Select JSON file"}
                </span>
                <span className="text-[10px] text-muted-foreground">Max 10MB · .json format</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {importing && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Importing...
                </div>
              )}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}
            </>
          )}

          {result && (
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Import complete!
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <ImportStat label="Food logs" value={result.imported.foodLogs} />
                <ImportStat label="Weight logs" value={result.imported.weightLogs} />
                <ImportStat label="Water logs" value={result.imported.waterLogs} />
                <ImportStat label="Exercises" value={result.imported.exerciseLogs} />
                <ImportStat label="Recipes" value={result.imported.recipes} />
                <ImportStat label="Goals" value={result.imported.goals} />
              </div>
              {result.skipped > 0 && (
                <div className="text-[11px] text-muted-foreground text-center">
                  {result.skipped} records skipped (invalid or duplicate)
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          {result ? (
            <DialogClose asChild>
              <Button className="w-full">Done</Button>
            </DialogClose>
          ) : (
            <DialogClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-accent/40 p-2">
      <div className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
