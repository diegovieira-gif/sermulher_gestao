import { booleano } from "@/lib/datas";

/**
 * Plano de gravação da chamada da Escola numa data (lógica pura, testável).
 *
 * Antes a chamada apagava todos os registros da data e recriava um a um: um
 * erro no meio deixava a data sem chamada, e um duplo clique gravava tudo em
 * dobro. Agora cada (turma, beneficiária, data) tem no máximo um registro:
 * atualiza o que existe, cria só o que falta e remove apenas o que não está
 * mais na lista (inclusive duplicatas antigas).
 */
export type RegistroExistente = { id: number; beneficiaria: unknown; presente: unknown };
export type PresencaDesejada = { beneficiariaId: number; presente: boolean };

export type PlanoFrequencia = {
  atualizar: Array<{ id: number; presente: boolean }>;
  criar: PresencaDesejada[];
  remover: number[];
};

export function planejarFrequencia(
  existentes: RegistroExistente[],
  desejadas: PresencaDesejada[],
): PlanoFrequencia {
  const porBeneficiaria = new Map<number, PresencaDesejada>();
  for (const p of desejadas) porBeneficiaria.set(Number(p.beneficiariaId), p);

  const atualizar: PlanoFrequencia["atualizar"] = [];
  const remover: number[] = [];
  const cobertas = new Set<number>();

  // Ordem por id: com duplicatas, o registro mais antigo é o que fica.
  for (const r of [...existentes].sort((a, b) => Number(a.id) - Number(b.id))) {
    const beneficiaria = Number(r.beneficiaria);
    const desejada = porBeneficiaria.get(beneficiaria);
    if (!desejada || cobertas.has(beneficiaria)) {
      remover.push(Number(r.id));
      continue;
    }
    cobertas.add(beneficiaria);
    if (booleano(r.presente) !== desejada.presente) {
      atualizar.push({ id: Number(r.id), presente: desejada.presente });
    }
  }

  const criar = [...porBeneficiaria.values()].filter(
    (p) => !cobertas.has(Number(p.beneficiariaId)),
  );

  return { atualizar, criar, remover };
}
