import { test, expect } from "@playwright/test";
import { configDa, COLLECTIONS_CONFIG } from "../../src/app/(admin)/observatorio/types";
import { exibirValor, montarRegistro } from "../../src/app/(admin)/observatorio/registro";

/**
 * Editor do Observatório: o que vai ao Directus tem de bater com o esquema
 * real das coleções obser_*, que é o que o site público lê.
 */

// Esquema conferido no Directus de produção em 08/10/2026.
const ESQUEMA: Record<string, string[]> = {
  obser_periodos: ["nome_periodo", "data_referencia", "ordem", "ativo", "nome"],
  obser_dashboards: [
    "period_label", "cram_periodo", "periodo_id",
    "cram_mulheres_encaminhadas", "cram_mulheres_atendidas", "cram_novos_casos",
    "cram_servicos_realizados", "cram_rodas_terapeuticas", "cram_atendimentos_grupo",
    "cram_busca_ativa", "cram_atendimentos_recepcao", "cram_acolhimentos_sociais",
    "cram_orientacoes_juridicas_total", "ser_ouvidoria_total_historico",
    "ser_sala_azul_encontros_individuais", "ser_sala_azul_grupos_reflexivos",
    "ser_sala_azul_participantes_medios", "ser_servicos_sociais", "ser_servicos_psicologicos",
    "ser_servicos_juridicos", "ser_acoes_conscientizacao", "ser_acoes_escutas",
    "ser_acoes_campanhas", "ser_capacitacoes_curso_cuidador",
    "ser_capacitacoes_feira_expositoras", "ser_capacitacoes_centro_vivo_data",
  ],
  obser_cram_atendimentos_psicologicos: ["serie_nome", "valor", "ordem", "periodo_id"],
  obser_cram_orientacoes_juridicas_distribuicao: ["serie_nome", "valor", "ordem", "periodo_id"],
  obser_sermulher_ouvidoria_series: ["serie_nome", "valor", "ordem", "periodo_id"],
  obser_sermulher_servicos_distribuicao: ["serie_nome", "valor", "ordem", "periodo_id"],
};

test("nenhuma coleção grava ou busca campo que não existe no Directus", () => {
  for (const c of COLLECTIONS_CONFIG) {
    const existentes = ESQUEMA[c.name];
    const { payload } = montarRegistro(c, {});
    for (const campo of Object.keys(payload)) expect(existentes, `${c.name}.${campo}`).toContain(campo);
    for (const campo of c.busca) expect(existentes, `busca ${c.name}.${campo}`).toContain(campo);
  }
});

test("o consolidado do mês cobre todos os campos do Directus", () => {
  const { payload } = montarRegistro(configDa("obser_dashboards"), {});
  expect(Object.keys(payload).sort()).toEqual([...ESQUEMA.obser_dashboards].sort());
});

test.describe("montarRegistro", () => {
  const periodos = configDa("obser_periodos");

  test("descarta o que não é da coleção e copia nome_periodo para a coluna antiga nome", () => {
    const { payload, faltando } = montarRegistro(periodos, {
      id: "uuid-1", date_created: "x", nome_periodo: " Abril 2026 ",
      data_referencia: "2026-04-01", ordem: "202604", ativo: true,
    });
    expect(faltando).toEqual([]);
    expect(payload).toEqual({
      nome_periodo: "Abril 2026", data_referencia: "2026-04-01", ordem: 202604, ativo: true, nome: "Abril 2026",
    });
  });

  test("aponta os obrigatórios vazios pelo rótulo", () => {
    const { faltando } = montarRegistro(periodos, { nome_periodo: "", ordem: "" });
    expect(faltando).toEqual(["Nome (ex.: Abril 2026)", "Data de referência", "Ordem (AAAAMM)"]);
  });

  test("relação expandida vira o id, e UUID não é convertido em número", () => {
    const { payload } = montarRegistro(configDa("obser_sermulher_ouvidoria_series"), {
      periodo_id: { id: "8f1c-uuid", nome_periodo: "Abril 2026" }, serie_nome: "Abr", valor: "12",
    });
    expect(payload.periodo_id).toBe("8f1c-uuid");
    expect(payload.valor).toBe(12);
    expect(payload.ordem).toBeNull();
  });

  test("zero é valor válido; texto não numérico vira vazio", () => {
    const { payload, faltando } = montarRegistro(configDa("obser_cram_atendimentos_psicologicos"), {
      periodo_id: "p", serie_nome: "Individual", valor: 0, ordem: "abc",
    });
    expect(payload.valor).toBe(0);
    expect(payload.ordem).toBeNull();
    expect(faltando).toEqual([]);
  });
});

test("exibirValor formata booleano, data e período", () => {
  expect(exibirValor("boolean", true)).toBe("Sim");
  expect(exibirValor("boolean", false)).toBe("Não");
  expect(exibirValor("date", "2026-04-01")).toBe("01/04/2026");
  expect(exibirValor("relation", { id: "x", nome_periodo: "Abril 2026" })).toBe("Abril 2026");
  expect(exibirValor("number", 0)).toBe("0");
  expect(exibirValor("text", null)).toBe("-");
});
