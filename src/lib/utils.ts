import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma data ISO (yyyy-mm-dd) para dd/mm/yyyy ignorando timezones.
 * Usa split string simples para garantir que o dia exibido é o dia salvo.
 */
/**
 * Data de hoje como AAAA-MM-DD no fuso LOCAL.
 *
 * `new Date().toISOString().slice(0,10)` devolve a data em UTC. No Brasil
 * (UTC-3), a partir das 21h a data UTC já é a do dia seguinte — então um campo
 * preenchido com "hoje" aparecia com a data de AMANHÃ para quem trabalhava à
 * noite. Aqui os componentes locais são lidos diretamente, sem conversão.
 */
export function todayLocalISO(date: Date = new Date()): string {
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mes}-${dia}`;
}

/**
 * Nome de quem registrou, a partir do campo `user_created`.
 *
 * Aceita as duas formas que o Directus devolve: o objeto expandido (quando a
 * relação com `directus_users` existe) e o UUID cru (quando não existe). No
 * segundo caso não há nome a mostrar, mas também não é verdade que o registro
 * veio de importação — por isso a distinção entre "não identificado" e a
 * ausência total de autor.
 */
export function nomeDeQuemRegistrou(
  userCreated:
    | { first_name?: string | null; last_name?: string | null; email?: string | null }
    | string
    | null
    | undefined,
): string {
  if (!userCreated) return "Sistema / Importação";

  if (typeof userCreated === "string") {
    // UUID cru: há autor, mas o nome não veio expandido.
    return "Usuário não identificado";
  }

  const nome = [userCreated.first_name, userCreated.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return nome || userCreated.email || "Usuário não identificado";
}

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
