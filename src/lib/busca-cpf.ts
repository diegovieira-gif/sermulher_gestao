/**
 * Localizar o CPF de uma beneficiária que não tem, pelo `hub/findCidadao`
 * do Hub de Dados Municipais (busca por nome, telefone e/ou nascimento).
 *
 * O resultado são CANDIDATOS, nunca o CPF gravado direto: uma pessoa da
 * equipe confere e confirma na tela "Localizar CPF". Homônimo e telefone
 * reaproveitado existem; gravar o CPF errado junta a ficha de uma mulher ao
 * cadastro de outra pessoa na Prefeitura.
 *
 * Módulo puro e SEM imports — também é usado pelo script de pré-busca
 * (scripts/hub/pre-busca-cpf.mjs), que o carrega direto no Node.
 */

export type FichaSemCpf = {
  id: number;
  nome_completo?: string | null;
  telefone?: string | null;
  data_nascimento?: string | null;
};

export type FiltrosHub = { nome?: string; telefone?: string; data_nascimento?: string };

export type ConsultaHub = { rotulo: string; filtros: FiltrosHub };

export type CandidatoHub = { nome?: string; cpf?: string; data_nascimento?: string };

export type SugestaoCpf = {
  cpf: string;
  nome: string;
  data_nascimento: string;
  /** Quais buscas acharam este CPF (ex.: "telefone + nascimento"). */
  criterios: string[];
  nome_confere: boolean;
  nascimento_confere: boolean;
};

export type SugestoesCpf = {
  buscado_em: string; // ISO
  buscas: string[]; // rótulos das buscas feitas
  situacao: "pendente" | "sem_resultado" | "descartada";
  truncado: boolean;
  candidatos: SugestaoCpf[];
};

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const LIGACOES = new Set(["da", "das", "de", "do", "dos", "e"]);
const partesDoNome = (s: string) => semAcento(s).split(" ").filter((p) => p && !LIGACOES.has(p));

/** Telefone para o Hub: DDD + número (10 ou 11 dígitos), sem o 55. */
export function telefoneParaBusca(valor: string | null | undefined): string {
  let d = String(valor ?? "").replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  return d.length === 10 || d.length === 11 ? d : "";
}

const dataValida = (v: string | null | undefined) => {
  const s = String(v ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
};

/** Nome para o Hub: o nome completo sem acento (o Hub ignora acento). */
function nomeParaBusca(valor: string | null | undefined): string {
  const s = semAcento(String(valor ?? ""));
  return s.length >= 6 ? s : "";
}

/**
 * As buscas que valem a pena para a ficha, da mais forte para a mais fraca.
 * Sempre dois critérios juntos: um só (só o nome, só o telefone) traz gente
 * demais e não identifica ninguém.
 */
export function consultasDaFicha(f: FichaSemCpf): ConsultaHub[] {
  const nome = nomeParaBusca(f.nome_completo);
  const telefone = telefoneParaBusca(f.telefone);
  const nasc = dataValida(f.data_nascimento);
  const c: ConsultaHub[] = [];
  if (telefone && nasc) c.push({ rotulo: "telefone + nascimento", filtros: { telefone, data_nascimento: nasc } });
  if (nome && telefone) c.push({ rotulo: "nome + telefone", filtros: { nome, telefone } });
  if (nome && nasc) c.push({ rotulo: "nome + nascimento", filtros: { nome, data_nascimento: nasc } });
  return c;
}

/**
 * Mesmo nome? Iguais sem acento, ou todas as partes do nome mais curto
 * aparecem no mais longo ("Maria Silva" ⊂ "Maria da Conceição Silva").
 */
export function nomesConferem(a: string | null | undefined, b: string | null | undefined): boolean {
  const pa = partesDoNome(String(a ?? ""));
  const pb = partesDoNome(String(b ?? ""));
  if (pa.length < 2 || pb.length < 2) return pa.join(" ") === pb.join(" ") && pa.length > 0;
  const [curto, longo] = pa.length <= pb.length ? [pa, pb] : [pb, pa];
  const resto = [...longo];
  for (const p of curto) {
    const i = resto.indexOf(p);
    if (i < 0) return false;
    resto.splice(i, 1);
  }
  // primeiro nome tem de bater (evita "Maria Souza" × "Ana Maria Souza")
  return curto[0] === longo[0];
}

/**
 * Junta os resultados das buscas: um candidato por CPF, com as buscas que o
 * acharam; ordena por quantas buscas o acharam e se nome/nascimento batem.
 */
export function combinarCandidatos(
  ficha: FichaSemCpf,
  resultados: { rotulo: string; data: CandidatoHub[]; truncado?: boolean }[],
  agora: Date = new Date(),
): SugestoesCpf {
  const porCpf = new Map<string, SugestaoCpf>();
  const nasc = dataValida(ficha.data_nascimento);
  for (const r of resultados) {
    for (const c of r.data ?? []) {
      const cpf = String(c.cpf ?? "").replace(/\D/g, "");
      if (cpf.length !== 11) continue;
      const atual = porCpf.get(cpf) ?? {
        cpf,
        nome: String(c.nome ?? "").trim(),
        data_nascimento: dataValida(c.data_nascimento),
        criterios: [],
        nome_confere: nomesConferem(ficha.nome_completo, c.nome),
        nascimento_confere: !!nasc && dataValida(c.data_nascimento) === nasc,
      };
      if (!atual.criterios.includes(r.rotulo)) atual.criterios.push(r.rotulo);
      porCpf.set(cpf, atual);
    }
  }
  const pontos = (s: SugestaoCpf) =>
    s.criterios.length * 10 + (s.nome_confere ? 2 : 0) + (s.nascimento_confere ? 1 : 0);
  const candidatos = [...porCpf.values()].sort((a, b) => pontos(b) - pontos(a));
  return {
    buscado_em: agora.toISOString(),
    buscas: resultados.map((r) => r.rotulo),
    situacao: candidatos.length ? "pendente" : "sem_resultado",
    truncado: resultados.some((r) => r.truncado),
    candidatos,
  };
}

/** Lê o JSON gravado (pode vir como texto do SQLite). */
export function lerSugestoes(v: unknown): SugestoesCpf | null {
  let o = v;
  if (typeof o === "string") {
    try {
      o = JSON.parse(o);
    } catch {
      return null;
    }
  }
  if (!o || typeof o !== "object" || !Array.isArray((o as SugestoesCpf).candidatos)) return null;
  return o as SugestoesCpf;
}
