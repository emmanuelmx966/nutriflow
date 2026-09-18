"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type BarcodeLookupResult } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScanLine, Loader2, CheckCircle2, X, Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  meal: string;
  date: string;
}

/**
 * BarcodeScanner — manual entry + live camera scanning via BarcodeDetector API.
 * Falls back gracefully to manual entry when camera/BarcodeDetector unavailable.
 */
export function BarcodeScanner({ meal, date }: BarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectRef = useRef<number | null>(null);
  const qc = useQueryClient();

  const lookup = useQuery({
    queryKey: ["barcode", code],
    queryFn: () => api.get<BarcodeLookupResult>(`/api/barcode?code=${code}`),
    enabled: code.length >= 8 && open && !cameraMode,
    retry: false,
  });

  const isBarcodeDetectorSupported =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  const stopCamera = useCallback(() => {
    if (detectRef.current) {
      cancelAnimationFrame(detectRef.current);
      detectRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraMode(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!isBarcodeDetectorSupported) {
      setCameraError("Live camera scanning isn't supported on this browser. Please enter the barcode manually below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraMode(true);
      // Start detection loop
      // @ts-expect-error - BarcodeDetector is not in TS lib yet
      const detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });

      const detectLoop = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue as string;
            if (/^\d{8,14}$/.test(raw)) {
              setCode(raw);
              stopCamera();
              return;
            }
          }
        } catch {
          // detection errors are transient; continue
        }
        detectRef.current = requestAnimationFrame(detectLoop);
      };
      detectLoop();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Camera access denied";
      setCameraError(
        msg.includes("denied") || msg.includes("permission")
          ? "Camera permission denied. Enable it in your browser settings, or enter the barcode manually."
          : "Could not start camera. Enter the barcode manually below.",
      );
    }
  }, [isBarcodeDetectorSupported, stopCamera]);

  // Cleanup on unmount only (no setState in effect body)
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleClose = (o: boolean) => {
    setOpen(o);
    if (!o) {
      stopCamera();
      setCode("");
      setCameraError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 gap-1 text-emerald-600 dark:text-emerald-400">
          <ScanLine className="h-4 w-4" /> Scan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-emerald-500" /> Scan barcode
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Camera preview */}
          {cameraMode && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scan overlay frame */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/3 border-2 border-emerald-400 rounded-lg shadow-lg shadow-emerald-400/50">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-300 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-300 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-300 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-300 rounded-br-lg" />
                </div>
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={stopCamera}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] text-white">
                Point at a barcode
              </div>
            </div>
          )}

          {cameraError && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 p-2.5 text-xs text-amber-700 dark:text-amber-400">
              {cameraError}
            </div>
          )}

          {!cameraMode && (
            <Button
              variant="outline"
              className="w-full"
              onClick={startCamera}
              disabled={!isBarcodeDetectorSupported}
            >
              <Camera className="h-4 w-4 mr-1.5" />
              {isBarcodeDetectorSupported ? "Use device camera" : "Camera not supported"}
            </Button>
          )}

          {!cameraMode && (
            <>
              <div className="text-center text-[10px] text-muted-foreground">— or enter manually —</div>
              <div className="space-y-1.5">
                <Input
                  autoFocus
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="e.g. 049000028904"
                  maxLength={14}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="text-lg tracking-wider text-center font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Try: 049000028904 (Coca-Cola) or 038000001114 (Corn Flakes)</p>
              </div>
            </>
          )}

          {/* Lookup result */}
          {code.length >= 8 && !cameraMode && (
            <div className="rounded-lg border border-border/60 p-3">
              {lookup.isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Looking up barcode...
                </div>
              )}
              {lookup.isError && (
                <div className="text-sm text-center">
                  <X className="h-5 w-5 text-destructive mx-auto mb-1" />
                  <div className="text-destructive font-medium">No food found</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This barcode isn&apos;t in our database yet. You can create a custom food for it.
                  </p>
                </div>
              )}
              {lookup.data && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{lookup.data.food.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {lookup.data.food.servingDesc} · {Math.round(lookup.data.food.caloriesPer100g * lookup.data.food.defaultServingG / 100)} kcal
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      try {
                        await api.post("/api/diary", {
                          date: new Date(date + "T12:00:00").toISOString(),
                          meal,
                          foodId: lookup.data.type === "food" ? lookup.data.food.id : undefined,
                          customFoodId: lookup.data.type === "custom" ? lookup.data.food.id : undefined,
                          quantityG: lookup.data.food.defaultServingG,
                        });
                        qc.invalidateQueries({ queryKey: ["diary", date] });
                        qc.invalidateQueries({ queryKey: ["dashboard", date] });
                        toast.success(`${lookup.data.food.name} added to ${meal}`);
                        setOpen(false);
                        setCode("");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed to add");
                      }
                    }}
                  >
                    Add 1 serving to {meal}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Keep CameraOff referenced for tree-shaking clarity
void CameraOff;
