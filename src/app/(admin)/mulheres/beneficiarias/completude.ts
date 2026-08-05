/**
 * Completude da ficha da beneficiária.
 *
 * Mede PROFUNDIDADE do cadastro, não quantidade de cadastros — de propósito.
 * Premiar volume num serviço de acolhimento a mulheres em situação de violência
 * incentivaria acolhimento apressado, ficha pela metade e registro duplicado.
 * Aqui o estímulo é melhorar a ficha que já existe.
 *
 * Os pesos vêm do consumo real dos campos no próprio sistema, não de opinião:
 * `telefone` aparece 27 vezes nos filtros de campanha de WhatsApp, `bairro` 7,
 * e `raca_cor_id`/`escolaridade_id` alimentam tanto os relatórios (RMA,
 * indicadores) quanto as campanhas. Campo sem consumidor automático pesa pouco.
 *
 * Módulo puro: sem I/O, sem `server-only`. Roda no servidor e no cliente.
 */

export type PesoCompletude = "alto" | "medio" | "baixo";

export interface CampoCompletude {
  /** Caminho no registro. Aceita aninhamento com ponto (ex.: endereco.bairro). */
  caminho: string;
  rotulo: string;
  peso: PesoCompletude;
  /** Aba do formulário onde o campo vive, para orientar quem for preencher. */
  aba: "dados-pessoais" | "endereco-contato" | "dados-sociais";
}

export const PONTOS: Record<PesoCompletude, number> = {
  alto: 15,
  medio: 8,
  baixo: 2,
};

/**
 * `nome_completo` fica de fora por ser obrigatório: está sempre presente e só
 * inflaria o índice sem informar nada.
 *
 * Os booleanos (`recebe_bolsa_familia`, `recebe_bpc`, `possui_medida_protetiva`)
 * também ficam de fora, e por um motivo mais sério: nascem `false`, então é
 * impossível distinguir "não recebe" de "ninguém perguntou". Contá-los como
 * preenchidos inflaria toda ficha; contá-los como vazios puniria quem
 * perguntou e ouviu não. A correção adequada é torná-los de três estados
 * (sim/não/não informado), o que exige migração — enquanto isso, não são
 * medidos aqui.
 */
export const CAMPOS_COMPLETUDE: CampoCompletude[] = [
  // Alto — a ausência quebra uma função que já existe.
  { caminho: "telefone", rotulo: "Telefone", peso: "alto", aba: "endereco-contato" },
  { caminho: "endereco.bairro", rotulo: "Bairro", peso: "alto", aba: "endereco-contato" },
  { caminho: "cpf", rotulo: "CPF", peso: "alto", aba: "dados-pessoais" },
  { caminho: "data_nascimento", rotulo: "Data de nascimento", peso: "alto", aba: "dados-pessoais" },

  // Médio — alimenta relatório oficial.
  { caminho: "raca_cor_id", rotulo: "Raça/cor", peso: "medio", aba: "dados-pessoais" },
  { caminho: "escolaridade_id", rotulo: "Escolaridade", peso: "medio", aba: "dados-sociais" },
  { caminho: "situacao_trabalho_id", rotulo: "Situação de trabalho", peso: "medio", aba: "dados-sociais" },

  // Baixo — contexto útil, sem consumidor automático hoje.
  { caminho: "nome_social", rotulo: "Nome social", peso: "baixo", aba: "dados-pessoais" },
  { caminho: "estado_civil_id", rotulo: "Estado civil", peso: "baixo", aba: "dados-pessoais" },
  { caminho: "quantidade_filhos", rotulo: "Quantidade de filhos", peso: "baixo", aba: "dados-pessoais" },
  { caminho: "email", rotulo: "E-mail", peso: "baixo", aba: "endereco-contato" },
  { caminho: "contato.melhor_turno_contato", rotulo: "Melhor turno para contato", peso: "baixo", aba: "endereco-contato" },
  { caminho: "endereco.cep", rotulo: "CEP", peso: "baixo", aba: "endereco-contato" },
  { caminho: "endereco.logradouro", rotulo: "Logradouro", peso: "baixo", aba: "endereco-contato" },
  { caminho: "endereco.numero", rotulo: "Número", peso: "baixo", aba: "endereco-contato" },
  { caminho: "endereco.cidade", rotulo: "Cidade", peso: "baixo", aba: "endereco-contato" },
  { caminho: "numero_cad_unico", rotulo: "Número do CadÚnico", peso: "baixo", aba: "dados-sociais" },
  { caminho: "ubs_id", rotulo: "UBS de referência", peso: "baixo", aba: "dados-sociais" },
  { caminho: "perfil_socioeconomico", rotulo: "Perfil socioeconômico", peso: "baixo", aba: "dados-sociais" },
];

export const TOTAL_PONTOS = CAMPOS_COMPLETUDE.reduce(
  (soma, campo) => soma + PONTOS[campo.peso],
  0,
);

/** Lê um caminho com ponto, tolerando JSON vindo como string do Directus. */
function lerCaminho(registro: unknown, caminho: string): unknown {
  let atual: unknown = registro;
  for (const parte of caminho.split(".")) {
    if (atual === null || atual === undefined) return undefined;
    if (typeof atual === "string") {
      // `contato` e `endereco` são colunas JSON: às vezes voltam serializadas.
      try {
        atual = JSON.parse(atual);
      } catch {
        return undefined;
      }
    }
    if (typeof atual !== "object") return undefined;
    atual = (atual as Record<string, unknown>)[parte];
  }
  return atual;
}

/**
 * Um campo conta como preenchido quando tem conteúdo real.
 *
 * `0` conta como preenchido — "nenhum filho" é uma resposta legítima, e
 * descartá-la puniria quem preencheu corretamente.
 */
export function estaPreenchido(valor: unknown): boolean {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === "string") return valor.trim() !== "";
  if (typeof valor === "number") return Number.isFinite(valor);
  if (Array.isArray(valor)) return valor.length > 0;
  if (typeof valor === "boolean") return true;
  return true;
}

export interface CampoPendente {
  rotulo: string;
  pontos: number;
  aba: CampoCompletude["aba"];
}

export interface ResumoCompletude {
  /** 0 a 100. */
  percentual: number;
  pontos: number;
  totalPontos: number;
  /** Pendentes ordenados por peso — o que mais rende aparece primeiro. */
  pendentes: CampoPendente[];
  /** Confirmação, não preenchimento: fica fora do percentual. */
  telefoneValidado: boolean;
  /** Existe telefone mas ninguém confirmou com a beneficiária. */
  telefonePendenteValidacao: boolean;
}

export function calcularCompletude(registro: unknown): ResumoCompletude {
  let pontos = 0;
  const pendentes: CampoPendente[] = [];

  for (const campo of CAMPOS_COMPLETUDE) {
    const valor = lerCaminho(registro, campo.caminho);
    const peso = PONTOS[campo.peso];
    if (estaPreenchido(valor)) {
      pontos += peso;
    } else {
      pendentes.push({ rotulo: campo.rotulo, pontos: peso, aba: campo.aba });
    }
  }

  pendentes.sort((a, b) => b.pontos - a.pontos || a.rotulo.localeCompare(b.rotulo));

  const telefone = lerCaminho(registro, "telefone");
  const telefoneValidado = lerCaminho(registro, "telefone_validado");
  // O Directus devolve booleanos como 1/0 nesta instância.
  const validado =
    telefoneValidado === true ||
    telefoneValidado === 1 ||
    telefoneValidado === "1" ||
    telefoneValidado === "true";

  return {
    percentual: Math.round((pontos / TOTAL_PONTOS) * 100),
    pontos,
    totalPontos: TOTAL_PONTOS,
    pendentes,
    telefoneValidado: validado,
    telefonePendenteValidacao: estaPreenchido(telefone) && !validado,
  };
}

/** Faixa usada para a cor e o texto de incentivo do modal. */
export function faixaCompletude(percentual: number): {
  nivel: "inicial" | "parcial" | "boa" | "completa";
  titulo: string;
} {
  if (percentual >= 100) return { nivel: "completa", titulo: "Ficha completa" };
  if (percentual >= 75) return { nivel: "boa", titulo: "Ficha quase completa" };
  if (percentual >= 40) return { nivel: "parcial", titulo: "Ficha em construção" };
  return { nivel: "inicial", titulo: "Ficha iniciada" };
}
