"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  text: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function InfoTooltip({ text, side = "top" }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className="cursor-help inline-flex items-center justify-center ml-1.5 align-middle transform translate-y-[-1px]">
             <Info className="h-3.5 w-3.5 text-muted-foreground/70 hover:text-primary transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[280px] text-xs font-normal">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
