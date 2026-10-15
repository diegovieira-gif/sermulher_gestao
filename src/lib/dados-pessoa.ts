/**
 * Dados de uma pessoa achados pelo CPF nas bases da Prefeitura, num formato
 * só — o que os cadastros do SIGMA (beneficiária, autor) usam para se
 * preencher sozinhos.
 *
 * Duas origens, combinadas:
 * - **Hub de Dados Municipais** (SMS, SEMED, COGETIN…, ~536 mil pessoas):
 *   nome, nascimento, nome da mãe e endereço. É a base principal.
 * - **SIGED** (rede municipal de educação): completa telefone, e-mail e nome
 *   social, que o Hub não traz, e cobre quem o Hub não tem.
 *
 * Módulo puro (sem rede): as consultas ficam em lib/consulta-cpf.ts.
 */

import { BAIRROS_ARACAJU } from "./utils";
import { nascimentoDoSiged, telefoneDoSiged, type RegistroSiged } from "./siged";

export type DadosPessoa = {
  nome_completo: string;
  nome_social: string;
  data_nascimento: string; // AAAA-MM-DD
  nome_mae: string;
  telefone: string; // só dígitos, sem o 55
  email: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
  };
};

export const ORIGEM_HUB = "Hub de Dados";
export const ORIGEM_SIGED = "SIGED";

const vazio = (): DadosPessoa => ({
  nome_completo: "",
  nome_social: "",
  data_nascimento: "",
  nome_mae: "",
  telefone: "",
  email: "",
  endereco: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "" },
});

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const MINUSCULAS = new Set(["da", "das", "de", "do", "dos", "e", "di", "du"]);

/**
 * "MARIA DA CONCEICAO DOS SANTOS" → "Maria da Conceicao dos Santos".
 * As bases da Prefeitura gravam em maiúsculas; o SIGMA guarda em caixa
 * normal. Texto que já vem em caixa mista é mantido como está.
 */
export function nomeProprio(valor: string): string {
  const s = texto(valor).replace(/\s+/g, " ");
  if (!s || s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .split(" ")
    .map((p, i) =>
      i > 0 && MINUSCULAS.has(p)
        ? p
        : p.replace(/(^|[-'’])(\p{L})/gu, (_, sep, l) => sep + l.toUpperCase()),
    )
    .join(" ");
}

/** Bairro da base → a grafia da lista do SIGMA, quando for o mesmo bairro. */
export function bairroDaLista(valor: string): string {
  const s = texto(valor);
  if (!s) return "";
  const alvo = sem(s);
  return BAIRROS_ARACAJU.find((b) => sem(b) === alvo) ?? nomeProprio(s);
}

const dataValida = (v: unknown) => {
  const s = texto(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
};

type FonteHub = {
  ultima_atualizacao_na_fonte?: string;
  dados?: {
    endereco?: Record<string, unknown> | null;
  } | null;
};

/** Resposta de `hub/cidadao` → DadosPessoa; null se o CPF não está no Hub. */
export function dadosDoHub(json: unknown): DadosPessoa | null {
  const j = json as {
    status?: string;
    resumo?: Record<string, unknown>;
    fontes?: FonteHub[];
  } | null;
  if (!j || j.status !== "success" || !j.resumo) return null;
  const d = vazio();
  d.nome_completo = nomeProprio(texto(j.resumo.nome));
  d.data_nascimento = dataValida(j.resumo.data_nascimento);
  d.nome_mae = nomeProprio(texto(j.resumo.nome_mae));

  // Endereço: o da fonte atualizada por último que tenha CEP ou logradouro.
  const comEndereco = (j.fontes ?? [])
    .filter((f) => {
      const e = f?.dados?.endereco;
      return e && (texto(e.cep) || texto(e.logradouro));
    })
    .sort((a, b) =>
      texto(b.ultima_atualizacao_na_fonte).localeCompare(texto(a.ultima_atualizacao_na_fonte)),
    );
  const e = comEndereco[0]?.dados?.endereco;
  if (e) {
    d.endereco = {
      cep: texto(e.cep).replace(/\D/g, "").slice(0, 8),
      logradouro: nomeProprio(texto(e.logradouro)),
      numero: texto(e.numero),
      complemento: nomeProprio(texto(e.complemento)),
      bairro: bairroDaLista(texto(e.bairro) || texto(j.resumo.bairro)),
      cidade: nomeProprio(texto(e.cidade)),
    };
  } else if (texto(j.resumo.bairro)) {
    d.endereco.bairro = bairroDaLista(texto(j.resumo.bairro));
  }
  return d;
}

/** Registro do SIGED → DadosPessoa. */
export function dadosDoSiged(r: RegistroSiged | null | undefined): DadosPessoa | null {
  if (!r) return null;
  const d = vazio();
  d.nome_completo = nomeProprio(texto(r.userName));
  d.nome_social = nomeProprio(texto(r.userSocialName));
  d.data_nascimento = nascimentoDoSiged(r.userBorn);
  d.telefone = telefoneDoSiged(r.userPhone1);
  d.email = texto(r.userMail).toLowerCase();
  const cidade = texto(r.userAddressCity);
  d.endereco = {
    cep: "",
    logradouro: texto(r.userAddressStreet),
    numero: texto(r.userAddressNumber),
    complemento: "",
    bairro: bairroDaLista(texto(r.userAddressDistrict)),
    cidade: cidade === "2800308" ? "Aracaju" : cidade, // código IBGE de Aracaju
  };
  return d;
}

/**
 * Junta as duas origens: o Hub manda em nome, nascimento, nome da mãe e
 * endereço; o SIGED completa o que faltar (telefone, e-mail, nome social, e
 * tudo quando o Hub não conhece o CPF). O endereço vai inteiro de uma
 * origem só, para não misturar rua de uma com número da outra.
 */
export function combinarDados(
  hub: DadosPessoa | null,
  siged: DadosPessoa | null,
): { dados: DadosPessoa | null; origens: string[] } {
  if (!hub && !siged) return { dados: null, origens: [] };
  const base = hub ?? siged!;
  const extra = hub ? siged : null;
  const d: DadosPessoa = { ...base, endereco: { ...base.endereco } };
  if (extra) {
    for (const k of ["nome_completo", "nome_social", "data_nascimento", "nome_mae", "telefone", "email"] as const) {
      if (!d[k] && extra[k]) d[k] = extra[k];
    }
    const temEndereco = Object.values(d.endereco).some(Boolean);
    if (!temEndereco) d.endereco = { ...extra.endereco };
  }
  const origens = [hub && ORIGEM_HUB, siged && ORIGEM_SIGED].filter(Boolean) as string[];
  return { dados: d, origens };
}
