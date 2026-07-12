import { timingSafeEqual } from "node:crypto";

/**
 * Comparação de strings em tempo constante (para segredos/tokens).
 *
 * `crypto.timingSafeEqual` exige buffers do mesmo tamanho; quando os tamanhos
 * diferem, fazemos uma comparação "dummy" de custo equivalente e retornamos
 * false, sem lançar exceção e sem vazar o tamanho pelo tempo de resposta.
 */
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  if (bufA.length !== bufB.length) {
    // Custo constante mesmo com tamanhos diferentes.
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
