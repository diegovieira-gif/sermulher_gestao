import "server-only";

/**
 * Limitador de tentativas de login, em memória.
 *
 * O sistema guarda dados de mulheres em situação de violência — o adversário
 * aqui não é abstrato: pode ser o próprio agressor tentando adivinhar a senha
 * de uma técnica. Sem isso, o endpoint de login aceitava tentativas ilimitadas.
 *
 * Janela deslizante: N falhas dentro da janela bloqueiam novas tentativas para
 * a mesma chave (IP e e-mail são controlados separadamente) até a falha mais
 * antiga sair da janela. Sucesso zera o contador da chave.
 *
 * Em memória de propósito: o deploy é um único processo Node (standalone no
 * Coolify), então não há necessidade de Redis. Se um dia houver múltiplas
 * réplicas, cada uma aplica o limite localmente — proteção menor, nunca menos
 * que nenhuma.
 */

const JANELA_MS = 15 * 60 * 1000;

/**
 * Limite por CONTA: protege a senha de uma pessoa específica.
 */
export const MAX_FALHAS_EMAIL = 5;

/**
 * Limite por ORIGEM: bem mais folgado de propósito. A secretaria inteira sai
 * pelo mesmo IP público (NAT), então um limite baixo aqui deixaria todas as
 * servidoras sem acesso porque cinco pessoas erraram a senha na segunda-feira.
 * Serve contra varredura distribuída de contas, não contra o erro cotidiano.
 */
export const MAX_FALHAS_IP = 30;

/** Faxina simples para o Map não crescer sem limite sob varredura de IPs. */
const MAX_CHAVES = 10_000;

const falhasPorChave = new Map<string, number[]>();

function podar(chave: string, agora: number): number[] {
  const lista = (falhasPorChave.get(chave) ?? []).filter(
    (t) => agora - t < JANELA_MS,
  );
  if (lista.length === 0) {
    falhasPorChave.delete(chave);
  } else {
    falhasPorChave.set(chave, lista);
  }
  return lista;
}

/** Segundos até a chave poder tentar de novo (0 = liberada). */
export function segundosParaLiberar(chave: string, maxFalhas: number): number {
  const agora = Date.now();
  const lista = podar(chave, agora);
  if (lista.length < maxFalhas) return 0;
  // A janela só corre a partir da falha que ainda conta para o limite.
  const maisAntigaRelevante = lista[lista.length - maxFalhas];
  return Math.max(
    1,
    Math.ceil((maisAntigaRelevante + JANELA_MS - agora) / 1000),
  );
}

export function registrarFalha(chave: string): void {
  const agora = Date.now();
  if (falhasPorChave.size > MAX_CHAVES) {
    // Sob pressão, descarta primeiro as chaves já fora da janela.
    for (const k of falhasPorChave.keys()) {
      podar(k, agora);
      if (falhasPorChave.size <= MAX_CHAVES) break;
    }
  }
  const lista = podar(chave, agora);
  lista.push(agora);
  falhasPorChave.set(chave, lista);
}

export function limparFalhas(chave: string): void {
  falhasPorChave.delete(chave);
}

/** Primeiro IP do X-Forwarded-For (o WAF/proxy reverso o preenche). */
export function ipDaRequisicao(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconhecido";
}
