import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma data ISO (yyyy-mm-dd) para dd/mm/yyyy ignorando timezones.
 * Usa split string simples para garantir que o dia exibido é o dia salvo.
 */
export function formatDateDisplay(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  // Pega apenas a parte da data YYYY-MM-DD
  const cleanDate = dateString.split('T')[0]; 
  const [year, month, day] = cleanDate.split('-');
  return `${day}/${month}/${year}`;
}
