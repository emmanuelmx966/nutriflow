"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, Construction } from "lucide-react";

/**
 * ReportsView — placeholder.
 *
 * Se completa en la Fase 3 con:
 *  - Selector de rango de fechas
 *  - Generación de PDF (con @react-pdf/renderer)
 *  - Descarga CSV
 */
export function ReportsView() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <FileText className="h-5 w-5 text-emerald-500" /> Reportes
      </h2>

      <Card className="border-dashed border-border/60">
        <CardContent className="py-16 text-center">
          <Construction className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <div className="text-sm font-medium">Reportes en camino</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Aquí podrás descargar tus datos en PDF y CSV por rango de fechas.
            Disponible en la próxima actualización.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}