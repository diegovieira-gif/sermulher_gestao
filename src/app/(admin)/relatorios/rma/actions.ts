"use server";

import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";

/**
 * Tipos de retorno para o RMA
 */
export type PerfilSocial = {
  recebe_bolsa_familia: number;
  recebe_bpc: number;
  possui_medida_protetiva: number;
};

export type Encaminhamentos = {
  cras: number;
  creas: number;
  saude: number;
  educacao: number;
  terceiro_setor: number;
  casa_abrigo: number;
  delegacia: number;
  nenhum: number;
};

export type TiposViolencia = {
  fisica: number;
  psicologica: number;
  sexual: number;
  patrimonial: number;
  moral: number;
};

export type VolumeRMA = {
  total_atendimentos: number;
  novos_casos: number;
};

export type PerfilRMA = {
  bolsa_familia: number;
  bpc: number;
  medida_protetiva: number;
};

export type LocalidadeRMA = {
  bairro: string;
  total: number;
};

export type DadosRMA = {
  volume: VolumeRMA;
  perfil: PerfilRMA;
  encaminhamentos: Encaminhamentos;
  tipos_violencia: TiposViolencia;
  localidades: LocalidadeRMA[];
};

/**
 * Tipo para atendimento retornado do Directus
 */
type AtendimentoRMA = {
  id: number;
  encaminhamento_rma: string | null;
  tipos_violencia: string | null;
  data_abertura: string | null;
  beneficiaria: {
    id: number;
    recebe_bolsa_familia: boolean | null;
    recebe_bpc: boolean | null;
    possui_medida_protetiva: boolean | null;
    endereco_bairro: string | null;
  } | null;
};

/**
 * Calcula o primeiro e último dia do mês/ano especificado
 */
function getRangeDatas(mes: number, ano: number): { inicio: string; fim: string } {
  // Validação de entrada
  if (mes < 1 || mes > 12) {
    throw new Error("Mês inválido. Deve estar entre 1 e 12.");
  }
  if (ano < 2000 || ano > 2100) {
    throw new Error("Ano inválido. Deve estar entre 2000 e 2100.");
  }

  // Primeiro dia do mês (00:00:00)
  const inicio = new Date(ano, mes - 1, 1);
  inicio.setHours(0, 0, 0, 0);

  // Último dia do mês (23:59:59)
  const fim = new Date(ano, mes, 0);
  fim.setHours(23, 59, 59, 999);

  return {
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
  };
}

/**
 * Agrega dados do Relatório Mensal de Atendimento (RMA)
 * 
 * @param params - Objeto com mês e ano { mes: number, ano: number }
 * @param params.mes - Número do mês (1-12)
 * @param params.ano - Número do ano (ex: 2024)
 * @returns Objeto estruturado com todas as agregações do RMA
 */
export async function getDadosRMA({
  mes,
  ano,
}: {
  mes: number;
  ano: number;
}): Promise<{ success: true; data: DadosRMA } | { success: false; error: string }> {
  try {
    // Validação de parâmetros
    if (!mes || !ano) {
      return {
        success: false,
        error: "Parâmetros 'mes' e 'ano' são obrigatórios.",
      };
    }

    // Calcula range de datas do mês
    const { inicio, fim } = getRangeDatas(mes, ano);

    // Busca atendimentos do mês com campos necessários
    const atendimentos = await directus.request(
      readItems("atendimentos", {
        fields: [
          "id",
          "encaminhamento_rma",
          "tipos_violencia",
          "data_abertura",
          "beneficiaria.id",
          "beneficiaria.recebe_bolsa_familia",
          "beneficiaria.recebe_bpc",
          "beneficiaria.possui_medida_protetiva",
          "beneficiaria.endereco.bairro",
        ],
        filter: {
          data_abertura: {
            _gte: inicio,
            _lte: fim,
          },
        },
        limit: -1, // Busca todos os atendimentos do mês
      })
    ) as AtendimentoRMA[];

    // Inicializa estruturas de agregação
    const perfilSocial: PerfilSocial = {
      recebe_bolsa_familia: 0,
      recebe_bpc: 0,
      possui_medida_protetiva: 0,
    };

    const encaminhamentos: Encaminhamentos = {
      cras: 0,
      creas: 0,
      saude: 0,
      educacao: 0,
      terceiro_setor: 0,
      casa_abrigo: 0,
      delegacia: 0,
      nenhum: 0,
    };

    const tiposViolencia: TiposViolencia = {
      fisica: 0,
      psicologica: 0,
      sexual: 0,
      patrimonial: 0,
      moral: 0,
    };

    // Mapa para contar localidades (bairros)
    const localidadesMap = new Map<string, number>();

    // Para identificar novos casos, precisamos verificar se é o primeiro atendimento da beneficiária no ano
    // Por enquanto, vamos contar todos como novos (simplificado)
    // TODO: Implementar lógica mais robusta verificando atendimentos anteriores da mesma beneficiária no ano
    const beneficiariasDoMes = new Set<number>();
    
    // Agregação dos dados
    atendimentos.forEach((atendimento) => {
      // Conta beneficiárias únicas para identificar novos casos
      if (atendimento.beneficiaria?.id) {
        beneficiariasDoMes.add(atendimento.beneficiaria.id);
      }

      // Agrega Perfil Social
      if (atendimento.beneficiaria) {
        if (atendimento.beneficiaria.recebe_bolsa_familia === true) {
          perfilSocial.recebe_bolsa_familia++;
        }
        if (atendimento.beneficiaria.recebe_bpc === true) {
          perfilSocial.recebe_bpc++;
        }
        if (atendimento.beneficiaria.possui_medida_protetiva === true) {
          perfilSocial.possui_medida_protetiva++;
        }
      }

      // Agrega Encaminhamentos
      if (atendimento.encaminhamento_rma) {
        const enc = atendimento.encaminhamento_rma.toLowerCase();
        if (enc in encaminhamentos) {
          (encaminhamentos as any)[enc]++;
        }
      } else {
        encaminhamentos.nenhum++;
      }

      // Agrega Tipos de Violência (CSV split)
      if (atendimento.tipos_violencia) {
        const tipos = atendimento.tipos_violencia
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0);

        tipos.forEach((tipo) => {
          // Mapeia variações possíveis para os tipos padrão
          const tipoNormalizado = tipo === "psicologica" ? "psicologica" : tipo;
          
          if (tipoNormalizado in tiposViolencia) {
            (tiposViolencia as any)[tipoNormalizado]++;
          }
        });
      }

      // Agrega Localidades (Bairros)
      if (atendimento.beneficiaria?.endereco_bairro) {
        const bairro = atendimento.beneficiaria.endereco_bairro;
        localidadesMap.set(bairro, (localidadesMap.get(bairro) || 0) + 1);
      }
    });

    // Para novos casos, verifica se é o primeiro atendimento da beneficiária no ano
    // Busca todos os atendimentos anteriores no mesmo ano para cada beneficiária do mês
    let novosCasos = 0;
    
    try {
      const inicioAno = new Date(ano, 0, 1);
      inicioAno.setHours(0, 0, 0, 0);
      const fimAno = new Date(ano, 11, 31, 23, 59, 59, 999);

      // Para cada beneficiária do mês, verifica se teve atendimento anterior no ano
      const promises = Array.from(beneficiariasDoMes).map(async (beneficiariaId) => {
        const atendimentosAnteriores = await directus.request(
          readItems("atendimentos", {
            fields: ["id"],
            filter: {
              beneficiaria: {
                _eq: beneficiariaId,
              },
              data_abertura: {
                _gte: inicioAno.toISOString(),
                _lt: inicio, // Antes do início do mês atual (inicio já é string ISO)
              },
            },
            limit: 1, // Apenas verifica se existe
          })
        );

        return atendimentosAnteriores.length === 0; // É novo caso se não teve atendimento anterior no ano
      });

      const resultados = await Promise.all(promises);
      novosCasos = resultados.filter((isNew) => isNew).length;
    } catch (error) {
      // Em caso de erro na verificação de novos casos, usa o total como fallback
      console.warn("Erro ao verificar novos casos, usando total como fallback:", error);
      novosCasos = beneficiariasDoMes.size;
    }

    // Monta objeto de retorno
    const dadosRMA: DadosRMA = {
      volume: {
        total_atendimentos: atendimentos.length,
        novos_casos: novosCasos,
      },
      perfil: {
        bolsa_familia: perfilSocial.recebe_bolsa_familia,
        bpc: perfilSocial.recebe_bpc,
        medida_protetiva: perfilSocial.possui_medida_protetiva,
      },
      encaminhamentos: encaminhamentos,
      tipos_violencia: tiposViolencia,
      localidades: Array.from(localidadesMap.entries())
        .map(([bairro, total]) => ({ bairro, total }))
        .sort((a, b) => b.total - a.total), // Ordena por total decrescente
    };

    return {
      success: true,
      data: dadosRMA,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do RMA:", error);

    // Tratamento de erros específicos
    if (error instanceof Error) {
      // Erro de validação de data
      if (error.message.includes("inválido")) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    return {
      success: false,
      error: "Erro ao buscar dados do RMA. Tente novamente.",
    };
  }
}
