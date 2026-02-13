"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <Button
            onClick={() => window.print()}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all hover:scale-105"
        >
            <Printer className="h-5 w-5" />
            Imprimir / Baixar PDF
        </Button>
    );
}
