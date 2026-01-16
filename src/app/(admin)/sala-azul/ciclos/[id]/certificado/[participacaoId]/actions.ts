"use server";

import { directus } from "@/lib/directus";
import { readItem } from "@directus/sdk";
import { StatusParticipacao } from "../../../schemas";

/**
 * Busca dados completos para o Certificado de Participação
 */
export async function getCertificadoData(participacaoId: string | number) {
  try {
    const id = Number(participacaoId);
    if (isNaN(id)) throw new Error("ID inválido");

    // Busca a participação com todos os relacionamentos necessários
    const participacao = await directus.request(
      readItem("participacoes_sala_azul", id, {
        fields: [
          "id",
          "status_participacao",
          "frequencia_percentual",
          // Dados do Infrator
          "infrator.nome_completo",
          "infrator.cpf",
          // Dados do Ciclo (Sala)
          "sala.nome_ciclo",
          "sala.data_inicio",
          "sala.data_termino",
          "sala.local_id.nome",
          "sala.local_id.endereco",
          // Responsável Técnico
          "sala.responsavel_tecnico.first_name",
          "sala.responsavel_tecnico.last_name",
        ],
      })
    );

    // Validação de Segurança: Só emite se aprovado
    if (participacao.status_participacao !== StatusParticipacao.CONCLUIDO_COM_EXITO) {
      return {
        success: false,
        error: "Este participante não possui status de 'Concluído com Êxito'.",
      };
    }

    return {
      success: true,
      data: participacao,
    };
  } catch (error) {
    console.error("Erro ao buscar certificado:", error);
    return {
      success: false,
      error: "Erro ao gerar certificado. Verifique os dados.",
    };
  }
}