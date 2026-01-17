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

/**
 * Lista padronizada de bairros de Aracaju
 * Conforme documento oficial do RMA (Relatório Mensal de Atendimento)
 * Bloco L - Localidade
 * Ordenado alfabeticamente
 */
export const BAIRROS_ARACAJU = [
  "17 de Março",
  "Aeroporto",
  "Almirante Tamandaré",
  "Bairro Industrial",
  "Bugio",
  "Capucho",
  "Centro",
  "Cirurgia",
  "Cidade Nova",
  "Coroa do Meio",
  "Distrito Industrial",
  "Farolândia",
  "Getúlio Vargas",
  "Grageru",
  "Iguatemi",
  "Jabotiana",
  "Jardim Atlântico",
  "Jardim Esperança",
  "Lamarão",
  "Laranjeiras",
  "Liberdade",
  "Mãe Vitória",
  "Malhado",
  "Marataízes",
  "Marinela",
  "Maruípe",
  "Mindelo",
  "Mosqueiro",
  "Mumbirendá",
  "Namorando",
  "Novo Paraíso",
  "Orlando Dantas",
  "Palestina",
  "Pão da Luta",
  "Paraíso",
  "Parque Anchieta",
  "Parque Faustino dos Santos",
  "Parque Leopoldina",
  "Parque Nossa Senhora da Conceição",
  "Parque Rosa Elze",
  "Parque Sementeira",
  "Parque São José",
  "Parque Sulista",
  "Parque Uberabinha",
  "Parque Valéria",
  "Peixoto",
  "Pereira Lobo",
  "Periços",
  "Pitanga",
  "Poço da Panela",
  "Poço Redondo",
  "Porto Dantas",
  "Porto Velho",
  "Princesa Isabel",
  "Riacho Doce",
  "Rua Acre",
  "Saiqui",
  "Sala Azul",
  "Salso",
  "Santa Maria",
  "Santaninha",
  "Santo Amaro",
  "Santos Dumont",
  "São Conrado",
  "São Jorge",
  "São Mateus",
  "Siqueira Campos",
  "Soledade",
  "Suíça",
  "Tabuleiro do Martins",
  "Tabuleiro dos Martins",
  "Tamatateua",
  "Tanque do Mato",
  "Trapiche da Barra",
  "Treze de Julho",
  "Turema",
  "Vieiralves",
  "Vinhedo",
  "Virgens",
  "Vista Mar",
  "Vitória Régia",
] as const;
