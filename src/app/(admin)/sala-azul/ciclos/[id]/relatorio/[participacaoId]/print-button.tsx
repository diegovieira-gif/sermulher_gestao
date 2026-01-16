"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <div className="print:hidden fixed top-4 right-4 z-50">
      <Button onClick={() => window.print()} className="shadow-lg">
        <Printer className="h-4 w-4 mr-2" />
        Imprimir
      </Button>
    </div>
  );
}
