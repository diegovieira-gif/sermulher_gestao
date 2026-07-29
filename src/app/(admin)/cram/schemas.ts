import { z } from "zod";

/**
 * Instrumental de Atendimento do CRAM
 * (Centro de Referência de Atendimento à Mulher em Situação de Violência).
 *
 * As listas abaixo reproduzem literalmente as opções do formulário impresso —
 * são padronizadas pelo instrumento, e por isso vivem no código e não em
 * tabelas `config_*` (que existem para o que a coordenação altera no dia a dia).
 *
 * Os dados pessoais (nome, CPF, nascimento, raça/cor, escolaridade, estado
 * civil) continuam vindo do prontuário em `beneficiarias`: o registro do CRAM
 * aponta para a beneficiária e guarda apenas o que é específico do atendimento.
 */

// --- Cabeçalho -------------------------------------------------------------

export const TURNOS = ["Manhã", "Tarde"] as const;

export const STATUS_INSTRUMENTAL = [
  "Em preenchimento",
  "Concluído",
  "Arquivado",
] as const;

// --- 1. Busca pelo serviço -------------------------------------------------

export const TIPOS_BUSCA = ["Espontânea", "Encaminhada"] as const;

export const INSTITUICOES_ENCAMINHAMENTO = [
  "Saúde",
  "DAGV",
  "Assistência Social",
  "Justiça",
  "Educação",
  "Outra",
] as const;

// --- Parte I: contexto socioassistencial -----------------------------------

export const SITUACOES_IMOVEL = [
  "Próprio",
  "Alugado",
  "Cedido",
  "Ocupado",
  "Situação de rua",
  "Outro",
] as const;

export const ITENS_SANEAMENTO = [
  "Água",
  "Energia",
  "Esgoto",
  "Pavimentação",
  "Coleta de lixo",
] as const;

export const TIPOS_DEFICIENCIA = [
  "Física",
  "Mental",
  "Visual",
  "Múltipla",
] as const;

export const FAIXAS_RENDA = [
  "Até R$ 218,00",
  "Até meio salário mínimo",
  "Até 1 salário mínimo",
  "Entre 2 e 3 salários",
  "Maior que 4 salários mínimos",
] as const;

export const BENEFICIOS_ASSISTENCIAIS = [
  "Bolsa Família",
  "BPC",
  "AME",
  "Auxílio Moradia",
  "Cartão Cmais",
  "Outro",
] as const;

export const NECESSIDADES_SOCIOASSISTENCIAIS = [
  "Recebimento de Cesta Básica",
  "Encaminhamento para solicitação do Programa Bolsa Família",
  "Encaminhamento para solicitação do Benefício de Prestação Continuada",
  "Encaminhamento para solicitação do AME",
  "Encaminhamento para solicitação do Auxílio Moradia",
  "Cadastro para o Cartão Cmais",
  "Outros",
] as const;

export const SERVICOS_FREQUENTADOS = [
  "CRAS",
  "CREAS",
  "Creche/Escola",
  "Unidade de Qualificação Profissional",
  "Unidade Básica de Saúde",
  "Outro",
] as const;

/** Chave usada no JSON `servicos_frequenta_detalhes` para cada serviço. */
export const SERVICO_DETALHE_KEYS: Record<
  (typeof SERVICOS_FREQUENTADOS)[number],
  string
> = {
  CRAS: "cras",
  CREAS: "creas",
  "Creche/Escola": "creche_escola",
  "Unidade de Qualificação Profissional": "qualificacao",
  "Unidade Básica de Saúde": "ubs",
  Outro: "outro",
};

export const TIPOS_VIOLENCIA_INSTRUMENTAL = [
  {
    valor: "Física",
    descricao: "empurrões, tapas, socos, chutes, uso de objetos ou armas",
  },
  {
    valor: "Psicológica",
    descricao: "ameaças, humilhações, xingamentos, controle, isolamento",
  },
  {
    valor: "Sexual",
    descricao: "abusos, coerção, estupro, impedir uso de contraceptivos",
  },
  {
    valor: "Patrimonial",
    descricao:
      "controle de dinheiro, destruição de bens, retenção de documentos",
  },
  {
    valor: "Moral",
    descricao: "calúnia, difamação, injúria, ofensa à honra",
  },
  {
    valor: "Negligência",
    descricao: "abandono, privação de cuidados básicos",
  },
] as const;

export const ENCAMINHAMENTOS_SOCIOASSISTENCIAIS = [
  "Abrigo Núbia Marques",
  "CREAS",
  "Outros",
] as const;

// --- Parte II: contexto jurídico -------------------------------------------

export const NECESSIDADES_JURIDICAS = [
  "Agendamento na Defensoria Pública",
  "Orientação sobre Direito de Família (custódia, divórcio, etc.)",
  "Orientação sobre Direito Penal (Medidas Protetivas, Lei Maria da Penha, etc.)",
  "Orientação sobre Direitos da Mulher (Lei do Minuto Seguinte, Lei de Violência Política contra a Mulher, etc.)",
  "Registro de SALVE MULHER",
  "Registro de B.O.",
  "Solicitação de Medida Protetiva",
] as const;

export const ORGAOS_ENCAMINHAMENTO_JURIDICO = [
  "Defensoria Pública",
  "Patrulha Maria da Penha",
  "Promotoria da Mulher (MP/SE)",
  "Delegacia Especializada (DAGV)",
  "Maternidade",
  "Instituto Médico Legal",
  "Outro",
] as const;

// --- Parte III: contexto psicológico ---------------------------------------

/** Respostas possíveis por pergunta — nem toda pergunta admite as quatro. */
export const RESPOSTAS_RISCO_COMPLETAS = [
  "Sim",
  "Não",
  "Não sabe dizer",
  "Não se aplica",
] as const;
export const RESPOSTAS_RISCO_SIM_NAO = ["Sim", "Não"] as const;
export const RESPOSTAS_RISCO_SEM_NA = [
  "Sim",
  "Não",
  "Não sabe dizer",
] as const;

export const PERGUNTAS_RISCO_CRAM = [
  {
    key: "violencia_aumentando",
    label:
      "A violência vem aumentando de gravidade e/ou de frequência no último mês?",
    opcoes: RESPOSTAS_RISCO_COMPLETAS,
  },
  {
    key: "agressor_persegue",
    label:
      "O(a) agressor(a) persegue a senhora/você, demonstra ciúmes excessivo, tenta controlar sua vida e as coisas que você faz? (aonde vai, com quem conversa, o tipo de roupa que usa, etc.)",
    opcoes: RESPOSTAS_RISCO_COMPLETAS,
  },
  {
    key: "agressao_fisica_anterior",
    label: "O(a) agressor(a) já a agrediu fisicamente outras vezes?",
    opcoes: RESPOSTAS_RISCO_SIM_NAO,
  },
  {
    key: "agressor_drogas_alcool",
    label: "O(a) agressor(a) é usuário de drogas e/ou bebidas alcoólicas?",
    opcoes: RESPOSTAS_RISCO_SEM_NA,
  },
  {
    key: "agressor_humilhava_publico",
    label:
      "O(a) agressor(a) ofendia, envergonhava ou ridicularizava a senhora/você quando estavam na frente de outras pessoas?",
    opcoes: RESPOSTAS_RISCO_COMPLETAS,
  },
  {
    key: "agressor_exibia_armas",
    label:
      "O(a) agressor(a) exibia armas de fogo, facas ou objetos como forma de intimidação?",
    opcoes: RESPOSTAS_RISCO_SIM_NAO,
  },
] as const;

export type PerguntaRiscoKey = (typeof PERGUNTAS_RISCO_CRAM)[number]["key"];

/** Respostas que contam como sinal de risco no cálculo do indicador. */
const RESPOSTAS_DE_RISCO = new Set(["Sim"]);

/**
 * Indicador simples de risco: nº de respostas "Sim" entre as 6 perguntas.
 * Não substitui a avaliação técnica — serve para ordenar a fila de atenção.
 */
export function calcularRisco(risco: Record<string, string | null | undefined>) {
  const total = PERGUNTAS_RISCO_CRAM.length;
  const positivas = PERGUNTAS_RISCO_CRAM.filter((p) =>
    RESPOSTAS_DE_RISCO.has(String(risco?.[p.key] ?? "")),
  ).length;

  const nivel =
    positivas >= 4 ? "Alto" : positivas >= 2 ? "Médio" : positivas >= 1 ? "Baixo" : "Sem sinais";

  return { positivas, total, nivel };
}

// --- Parte IV: Plano Individual de Atendimento ------------------------------

export const PROCEDIMENTOS_PARTICIPACAO = [
  { key: "atende_convocacoes", label: "Atende às convocações da equipe" },
  { key: "presenca_rodas", label: "Presença nas rodas terapêuticas" },
  {
    key: "providenciou_documentacao",
    label: "Providenciou a documentação faltante após encaminhamentos",
  },
  {
    key: "presenca_atendimentos_psicologicos",
    label: "Presença nos atendimentos psicológicos marcados",
  },
] as const;

// --- Helpers de validação ---------------------------------------------------

const textoOpcional = z.string().trim().optional().nullable();
const booleanoOpcional = z.coerce.boolean().optional().nullable();

/** Aceita `undefined`/`null` e normaliza para array de strings. */
const listaDeTexto = z
  .union([z.array(z.string()), z.null(), z.undefined()])
  .transform((v) => (Array.isArray(v) ? v.filter(Boolean) : []));

/** Valida um array contra uma lista fechada, descartando valores estranhos. */
function listaFechada(opcoes: readonly string[]) {
  const validas = new Set(opcoes);
  return listaDeTexto.transform((v) => v.filter((item) => validas.has(item)));
}

// --- Schema: composição domiciliar -----------------------------------------

export const membroDomiciliarSchema = z.object({
  id: z.coerce.number().optional(),
  nome: z.string().trim().min(1, "Informe o nome"),
  parentesco: textoOpcional,
  idade: z.coerce.number().int().min(0).max(130).optional().nullable(),
  escolaridade: textoOpcional,
  ocupacao_renda: textoOpcional,
  beneficio_assistencial: textoOpcional,
});

export type MembroDomiciliar = z.infer<typeof membroDomiciliarSchema>;

// --- Schema: instrumental de atendimento -----------------------------------

export const instrumentalSchema = z.object({
  id: z.coerce.number().optional(),

  beneficiaria: z.coerce
    .number({ message: "Selecione a assistida" })
    .int()
    .positive({ message: "Selecione a assistida" }),

  data_atendimento: z.string().min(1, "Informe a data do atendimento"),
  turno: z.enum(TURNOS).optional().nullable(),
  status: z.enum(STATUS_INSTRUMENTAL).default("Em preenchimento"),

  // 1. Busca pelo serviço
  busca_tipo: z.enum(TIPOS_BUSCA).optional().nullable(),
  busca_como_soube: textoOpcional,
  busca_encaminhada_por: z
    .enum(INSTITUICOES_ENCAMINHAMENTO)
    .optional()
    .nullable(),
  busca_encaminhada_outra: textoOpcional,
  possui_medida_protetiva: booleanoOpcional,
  servico_buscado: textoOpcional,

  // Documentação que não existe no prontuário
  rg: textoOpcional,
  cartao_sus: textoOpcional,

  // Parte I — situação habitacional
  imovel_situacao: z.enum(SITUACOES_IMOVEL).optional().nullable(),
  imovel_situacao_outro: textoOpcional,
  saneamento: listaFechada(ITENS_SANEAMENTO),

  // Parte I — deficiência
  possui_deficiencia: booleanoOpcional,
  deficiencia_tipos: listaFechada(TIPOS_DEFICIENCIA),

  // Parte I — saúde
  saude_problema: booleanoOpcional,
  saude_problema_qual: textoOpcional,
  fuma: booleanoOpcional,
  fuma_tempo: textoOpcional,
  fuma_frequencia: textoOpcional,
  usa_drogas: booleanoOpcional,
  drogas_qual: textoOpcional,
  drogas_tempo: textoOpcional,
  drogas_frequencia: textoOpcional,
  uso_abusivo_alcool: booleanoOpcional,
  alcool_tempo: textoOpcional,
  ubs_id: z.coerce.number().int().positive().optional().nullable(),

  // Parte I — trabalho e renda
  profissao_ocupacao: textoOpcional,
  faixa_renda: z.enum(FAIXAS_RENDA).optional().nullable(),
  recebe_beneficio: booleanoOpcional,
  beneficios: listaFechada(BENEFICIOS_ASSISTENCIAIS),
  beneficios_outro: textoOpcional,
  cartao_cmais_quando: textoOpcional,
  necessidades_socioassistenciais: listaFechada(NECESSIDADES_SOCIOASSISTENCIAIS),
  necessidades_socioassistenciais_outro: textoOpcional,

  // Parte I — localização alternativa
  contato_alternativo_nome: textoOpcional,
  contato_alternativo_telefone: textoOpcional,
  contato_alternativo_endereco: textoOpcional,

  // Parte I — serviços que frequenta
  servicos_frequenta: listaFechada(SERVICOS_FREQUENTADOS),
  servicos_frequenta_detalhes: z
    .record(z.string(), z.string())
    .optional()
    .nullable(),

  // Parte I — caracterização da violência
  tipos_violencia: listaFechada(
    TIPOS_VIOLENCIA_INSTRUMENTAL.map((t) => t.valor),
  ),

  // Parte I — autor da violência
  autor_nome: textoOpcional,
  autor_naturalidade: textoOpcional,
  autor_idade: z.coerce.number().int().min(0).max(130).optional().nullable(),
  autor_sexo: textoOpcional,
  autor_raca: textoOpcional,
  autor_relacao_vitima: textoOpcional,
  autor_endereco: textoOpcional,

  // Parte I — encaminhamento socioassistencial pós-atendimento
  encaminhamento_socio: booleanoOpcional,
  encaminhamento_socio_destinos: listaFechada(
    ENCAMINHAMENTOS_SOCIOASSISTENCIAIS,
  ),
  encaminhamento_socio_outro: textoOpcional,

  // Parte II — jurídico
  necessidades_juridicas: listaFechada(NECESSIDADES_JURIDICAS),
  bo_realizado: booleanoOpcional,
  bo_realizado_por_nos: booleanoOpcional,
  solicitou_medida_protetiva: booleanoOpcional,
  encaminhamento_juridico: listaFechada(ORGAOS_ENCAMINHAMENTO_JURIDICO),
  encaminhamento_juridico_outro: textoOpcional,

  // Parte III — psicológico
  risco: z.record(z.string(), z.string()).optional().nullable(),
  resumo_psicologa: textoOpcional,

  responsavel_atendimento: textoOpcional,
  observacoes: textoOpcional,

  composicao_domiciliar: z.array(membroDomiciliarSchema).optional(),
});

export type InstrumentalFormValues = z.input<typeof instrumentalSchema>;
export type Instrumental = z.infer<typeof instrumentalSchema>;

/**
 * Espelho do schema acima para uso no `react-hook-form`.
 *
 * Sem `transform`, `coerce` ou `default` — assim `z.input` e `z.output` são o
 * mesmo tipo e o `zodResolver` não precisa de gambiarra de tipagem. A validação
 * que vale é a do servidor (`instrumentalSchema`); aqui o objetivo é só dar
 * feedback imediato nos dois campos que travam o salvamento.
 */
export const instrumentalFormSchema = z.object({
  id: z.number().optional(),
  beneficiaria: z
    .number({ message: "Selecione a assistida" })
    .int()
    .positive("Selecione a assistida"),
  data_atendimento: z.string().min(1, "Informe a data do atendimento"),
  turno: z.string().optional().nullable(),
  status: z.string(),

  busca_tipo: z.string().optional().nullable(),
  busca_como_soube: z.string().optional().nullable(),
  busca_encaminhada_por: z.string().optional().nullable(),
  busca_encaminhada_outra: z.string().optional().nullable(),
  possui_medida_protetiva: z.boolean().optional().nullable(),
  servico_buscado: z.string().optional().nullable(),

  rg: z.string().optional().nullable(),
  cartao_sus: z.string().optional().nullable(),

  imovel_situacao: z.string().optional().nullable(),
  imovel_situacao_outro: z.string().optional().nullable(),
  saneamento: z.array(z.string()),

  possui_deficiencia: z.boolean().optional().nullable(),
  deficiencia_tipos: z.array(z.string()),

  saude_problema: z.boolean().optional().nullable(),
  saude_problema_qual: z.string().optional().nullable(),
  fuma: z.boolean().optional().nullable(),
  fuma_tempo: z.string().optional().nullable(),
  fuma_frequencia: z.string().optional().nullable(),
  usa_drogas: z.boolean().optional().nullable(),
  drogas_qual: z.string().optional().nullable(),
  drogas_tempo: z.string().optional().nullable(),
  drogas_frequencia: z.string().optional().nullable(),
  uso_abusivo_alcool: z.boolean().optional().nullable(),
  alcool_tempo: z.string().optional().nullable(),
  ubs_id: z.number().nullable().optional(),

  profissao_ocupacao: z.string().optional().nullable(),
  faixa_renda: z.string().optional().nullable(),
  recebe_beneficio: z.boolean().optional().nullable(),
  beneficios: z.array(z.string()),
  beneficios_outro: z.string().optional().nullable(),
  cartao_cmais_quando: z.string().optional().nullable(),
  necessidades_socioassistenciais: z.array(z.string()),
  necessidades_socioassistenciais_outro: z.string().optional().nullable(),

  contato_alternativo_nome: z.string().optional().nullable(),
  contato_alternativo_telefone: z.string().optional().nullable(),
  contato_alternativo_endereco: z.string().optional().nullable(),

  servicos_frequenta: z.array(z.string()),
  servicos_frequenta_detalhes: z.record(z.string(), z.string()),

  tipos_violencia: z.array(z.string()),

  autor_nome: z.string().optional().nullable(),
  autor_naturalidade: z.string().optional().nullable(),
  autor_idade: z.number().nullable().optional(),
  autor_sexo: z.string().optional().nullable(),
  autor_raca: z.string().optional().nullable(),
  autor_relacao_vitima: z.string().optional().nullable(),
  autor_endereco: z.string().optional().nullable(),

  encaminhamento_socio: z.boolean().optional().nullable(),
  encaminhamento_socio_destinos: z.array(z.string()),
  encaminhamento_socio_outro: z.string().optional().nullable(),

  necessidades_juridicas: z.array(z.string()),
  bo_realizado: z.boolean().optional().nullable(),
  bo_realizado_por_nos: z.boolean().optional().nullable(),
  solicitou_medida_protetiva: z.boolean().optional().nullable(),
  encaminhamento_juridico: z.array(z.string()),
  encaminhamento_juridico_outro: z.string().optional().nullable(),

  risco: z.record(z.string(), z.string()),
  resumo_psicologa: z.string().optional().nullable(),

  responsavel_atendimento: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),

  composicao_domiciliar: z.array(
    z.object({
      id: z.number().optional(),
      nome: z.string(),
      parentesco: z.string().optional().nullable(),
      idade: z.number().nullable().optional(),
      escolaridade: z.string().optional().nullable(),
      ocupacao_renda: z.string().optional().nullable(),
      beneficio_assistencial: z.string().optional().nullable(),
    }),
  ),
});

export type InstrumentalFormState = z.infer<typeof instrumentalFormSchema>;

/** Valores iniciais de um instrumental em branco. */
export function instrumentalVazio(): InstrumentalFormState {
  return {
    beneficiaria: 0,
    data_atendimento: new Date().toISOString().slice(0, 10),
    turno: null,
    status: "Em preenchimento",
    busca_tipo: null,
    busca_como_soube: "",
    busca_encaminhada_por: null,
    busca_encaminhada_outra: "",
    possui_medida_protetiva: false,
    servico_buscado: "",
    rg: "",
    cartao_sus: "",
    imovel_situacao: null,
    imovel_situacao_outro: "",
    saneamento: [],
    possui_deficiencia: false,
    deficiencia_tipos: [],
    saude_problema: false,
    saude_problema_qual: "",
    fuma: false,
    fuma_tempo: "",
    fuma_frequencia: "",
    usa_drogas: false,
    drogas_qual: "",
    drogas_tempo: "",
    drogas_frequencia: "",
    uso_abusivo_alcool: false,
    alcool_tempo: "",
    ubs_id: null,
    profissao_ocupacao: "",
    faixa_renda: null,
    recebe_beneficio: false,
    beneficios: [],
    beneficios_outro: "",
    cartao_cmais_quando: "",
    necessidades_socioassistenciais: [],
    necessidades_socioassistenciais_outro: "",
    contato_alternativo_nome: "",
    contato_alternativo_telefone: "",
    contato_alternativo_endereco: "",
    servicos_frequenta: [],
    servicos_frequenta_detalhes: {},
    tipos_violencia: [],
    autor_nome: "",
    autor_naturalidade: "",
    autor_idade: null,
    autor_sexo: "",
    autor_raca: "",
    autor_relacao_vitima: "",
    autor_endereco: "",
    encaminhamento_socio: false,
    encaminhamento_socio_destinos: [],
    encaminhamento_socio_outro: "",
    necessidades_juridicas: [],
    bo_realizado: false,
    bo_realizado_por_nos: false,
    solicitou_medida_protetiva: false,
    encaminhamento_juridico: [],
    encaminhamento_juridico_outro: "",
    risco: {},
    resumo_psicologa: "",
    responsavel_atendimento: "",
    observacoes: "",
    composicao_domiciliar: [],
  };
}

// --- Schema: Plano Individual de Atendimento -------------------------------

export const pactuacaoSchema = z.object({
  id: z.coerce.number().optional(),
  demanda_identificada: z.string().trim().min(1, "Informe a demanda"),
  servico_ofertado: textoOpcional,
  acao_realizada: textoOpcional,
});

export const evolucaoSchema = z.object({
  id: z.coerce.number().optional(),
  data: z.string().min(1, "Informe a data"),
  descricao: z.string().trim().min(1, "Descreva a evolução"),
  tecnico: textoOpcional,
});

export const piaSchema = z.object({
  id: z.coerce.number().optional(),
  beneficiaria: z.coerce
    .number({ message: "Selecione a assistida" })
    .int()
    .positive({ message: "Selecione a assistida" }),
  cram_atendimento: z.coerce.number().int().positive().optional().nullable(),
  data_abertura: z.string().min(1, "Informe a data de abertura"),
  status: z.enum(["Ativo", "Encerrado"]).default("Ativo"),
  historico_demanda: textoOpcional,
  participacao: z.record(z.string(), z.string()).optional().nullable(),
  participacao_obs: textoOpcional,
  pactuacoes: z.array(pactuacaoSchema).optional(),
});

export type PiaFormValues = z.input<typeof piaSchema>;
export type Pia = z.infer<typeof piaSchema>;
export type Pactuacao = z.infer<typeof pactuacaoSchema>;
export type Evolucao = z.infer<typeof evolucaoSchema>;
