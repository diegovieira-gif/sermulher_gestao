import { instrumentalVazio, type InstrumentalFormState } from "../schemas";

/**
 * Converte o registro do Directus para o estado do formulário.
 *
 * Trata os dois formatos que o Directus devolve para M2O (id cru ou objeto
 * expandido) e garante que campos JSON nulos virem `[]`/`{}` — o formulário
 * assume arrays e objetos sempre presentes.
 */

const idDe = (valor: unknown): number | null => {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "object") {
    const id = (valor as { id?: unknown }).id;
    return typeof id === "number" ? id : Number(id) || null;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
};

const lista = (valor: unknown): string[] =>
  Array.isArray(valor) ? valor.filter((item): item is string => typeof item === "string") : [];

const objetoDeTexto = (valor: unknown): Record<string, string> => {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  return Object.fromEntries(
    Object.entries(valor as Record<string, unknown>)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k, v as string]),
  );
};

const texto = (valor: unknown): string =>
  typeof valor === "string" ? valor : valor === null || valor === undefined ? "" : String(valor);

/**
 * O Directus devolve booleanos como `1`/`0` nesta instância (e como `true`/
 * `false` em outras, conforme o driver do banco). Comparar com `=== true` fazia
 * um "Sim" gravado reaparecer como "Não" ao reabrir o instrumental.
 */
const booleano = (valor: unknown): boolean =>
  valor === true || valor === 1 || valor === "1" || valor === "true";

const numeroOuNulo = (valor: unknown): number | null => {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

const dataCurta = (valor: unknown): string =>
  typeof valor === "string" && valor.length >= 10 ? valor.slice(0, 10) : "";

export function paraFormulario(registro: Record<string, unknown>): InstrumentalFormState {
  const base = instrumentalVazio();

  const membros = Array.isArray(registro.composicao_domiciliar)
    ? (registro.composicao_domiciliar as Array<Record<string, unknown>>)
    : [];

  return {
    ...base,
    id: numeroOuNulo(registro.id) ?? undefined,
    beneficiaria: idDe(registro.beneficiaria) ?? 0,
    data_atendimento: dataCurta(registro.data_atendimento) || base.data_atendimento,
    turno: texto(registro.turno) || null,
    status: texto(registro.status) || base.status,

    busca_tipo: texto(registro.busca_tipo) || null,
    busca_como_soube: texto(registro.busca_como_soube),
    busca_encaminhada_por: texto(registro.busca_encaminhada_por) || null,
    busca_encaminhada_outra: texto(registro.busca_encaminhada_outra),
    possui_medida_protetiva: booleano(registro.possui_medida_protetiva),
    servico_buscado: texto(registro.servico_buscado),

    rg: texto(registro.rg),
    cartao_sus: texto(registro.cartao_sus),

    imovel_situacao: texto(registro.imovel_situacao) || null,
    imovel_situacao_outro: texto(registro.imovel_situacao_outro),
    saneamento: lista(registro.saneamento),

    possui_deficiencia: booleano(registro.possui_deficiencia),
    deficiencia_tipos: lista(registro.deficiencia_tipos),

    saude_problema: booleano(registro.saude_problema),
    saude_problema_qual: texto(registro.saude_problema_qual),
    fuma: booleano(registro.fuma),
    fuma_tempo: texto(registro.fuma_tempo),
    fuma_frequencia: texto(registro.fuma_frequencia),
    usa_drogas: booleano(registro.usa_drogas),
    drogas_qual: texto(registro.drogas_qual),
    drogas_tempo: texto(registro.drogas_tempo),
    drogas_frequencia: texto(registro.drogas_frequencia),
    uso_abusivo_alcool: booleano(registro.uso_abusivo_alcool),
    alcool_tempo: texto(registro.alcool_tempo),
    ubs_id: idDe(registro.ubs_id),

    profissao_ocupacao: texto(registro.profissao_ocupacao),
    faixa_renda: texto(registro.faixa_renda) || null,
    recebe_beneficio: booleano(registro.recebe_beneficio),
    beneficios: lista(registro.beneficios),
    beneficios_outro: texto(registro.beneficios_outro),
    cartao_cmais_quando: texto(registro.cartao_cmais_quando),
    necessidades_socioassistenciais: lista(registro.necessidades_socioassistenciais),
    necessidades_socioassistenciais_outro: texto(
      registro.necessidades_socioassistenciais_outro,
    ),

    contato_alternativo_nome: texto(registro.contato_alternativo_nome),
    contato_alternativo_telefone: texto(registro.contato_alternativo_telefone),
    contato_alternativo_endereco: texto(registro.contato_alternativo_endereco),

    servicos_frequenta: lista(registro.servicos_frequenta),
    servicos_frequenta_detalhes: objetoDeTexto(registro.servicos_frequenta_detalhes),

    tipos_violencia: lista(registro.tipos_violencia),

    autor_nome: texto(registro.autor_nome),
    autor_naturalidade: texto(registro.autor_naturalidade),
    autor_idade: numeroOuNulo(registro.autor_idade),
    autor_sexo: texto(registro.autor_sexo),
    autor_raca: texto(registro.autor_raca),
    autor_relacao_vitima: texto(registro.autor_relacao_vitima),
    autor_endereco: texto(registro.autor_endereco),

    encaminhamento_socio: booleano(registro.encaminhamento_socio),
    encaminhamento_socio_destinos: lista(registro.encaminhamento_socio_destinos),
    encaminhamento_socio_outro: texto(registro.encaminhamento_socio_outro),

    necessidades_juridicas: lista(registro.necessidades_juridicas),
    bo_realizado: booleano(registro.bo_realizado),
    bo_realizado_por_nos: booleano(registro.bo_realizado_por_nos),
    solicitou_medida_protetiva: booleano(registro.solicitou_medida_protetiva),
    encaminhamento_juridico: lista(registro.encaminhamento_juridico),
    encaminhamento_juridico_outro: texto(registro.encaminhamento_juridico_outro),

    risco: objetoDeTexto(registro.risco),
    resumo_psicologa: texto(registro.resumo_psicologa),

    responsavel_atendimento: texto(registro.responsavel_atendimento),
    observacoes: texto(registro.observacoes),

    composicao_domiciliar: membros.map((membro) => ({
      id: numeroOuNulo(membro.id) ?? undefined,
      nome: texto(membro.nome),
      parentesco: texto(membro.parentesco),
      idade: numeroOuNulo(membro.idade),
      escolaridade: texto(membro.escolaridade),
      ocupacao_renda: texto(membro.ocupacao_renda),
      beneficio_assistencial: texto(membro.beneficio_assistencial),
    })),
  };
}
