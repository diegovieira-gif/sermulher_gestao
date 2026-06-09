"use server";

import { revalidatePath } from "next/cache";
import { getDirectusClient, safeDirectusCall } from "@/lib/directus";
import {
  readItems,
  createItem,
  updateItem,
  deleteItem,
  readItem,
  readMe,
} from "@directus/sdk";

// Helper for deep plain objects to avoid Next.js payload issues
function toPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// 1. WhatsApp Connection Configuration Settings
export async function getWhatsappConfig() {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });

      try {
        const me = await client.request(
          readMe({
            fields: ["id", "email", "first_name", "last_name", "role.name", "role.id", "role.admin_access"],
          })
        );
        console.log("DEBUG getWhatsappConfig - Logged in user:", JSON.stringify(me, null, 2));
      } catch (meError: any) {
        console.log("DEBUG getWhatsappConfig - Failed to fetch user profile:", meError?.message);
      }

      const items = await client.request(
        readItems("configuracoes_site", {
          limit: 1,
          fields: [
            "id",
            "evolution_api_url",
            "evolution_api_token",
            "evolution_api_instance",
            "n8n_webhook_url",
          ],
        })
      );
      return {
        success: true,
        data: items?.[0] ? toPlainObject(items[0]) : null,
      };
    });
  } catch (error: any) {
    console.error("Erro em getWhatsappConfig:", error);
    return {
      success: false,
      error: "Sem permissão para acessar 'configuracoes_site' ou coleção não existe."
    };
  }
}

export async function saveWhatsappConfig(data: {
  id?: number;
  evolution_api_url: string | null;
  evolution_api_token: string | null;
  evolution_api_instance: string | null;
  n8n_webhook_url: string | null;
}) {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });
      const { id, ...payload } = data;

      let result;
      if (id) {
        result = await client.request(updateItem("configuracoes_site", id, payload));
      } else {
        // Find the first configuration if ID is missing (singleton)
        const existing = await client.request(
          readItems("configuracoes_site", { limit: 1, fields: ["id"] })
        );
        if (existing?.[0]?.id) {
          result = await client.request(
            updateItem("configuracoes_site", existing[0].id, payload)
          );
        } else {
          result = await client.request(createItem("configuracoes_site", payload));
        }
      }

      revalidatePath("/marketing/whatsapp");
      return { success: true, data: toPlainObject(result) };
    });
  } catch (error: any) {
    console.error("Erro em saveWhatsappConfig:", error);
    return {
      success: false,
      error: "Você não tem permissão para salvar configurações ou a coleção não existe."
    };
  }
}

// 2. Test connection with Evolution API
export async function testEvolutionConnection(config: {
  url: string;
  token: string;
  instance: string;
}) {
  try {
    const { url, token, instance } = config;
    if (!url || !token || !instance) {
      return { success: false, error: "Parâmetros de conexão incompletos." };
    }

    const cleanUrl = url.replace(/\/$/, "");
    const testUrl = `${cleanUrl}/instance/connectionState/${instance}`;

    const res = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: token,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return {
        success: false,
        error: `Evolution API respondeu com status ${res.status}: ${errorText || "Sem resposta"}`,
      };
    }

    const data = await res.json();
    const isConnected = data?.instance?.state === "open";

    return {
      success: true,
      state: data?.instance?.state || "unknown",
      isConnected,
      raw: data,
    };
  } catch (error: any) {
    console.error("Erro ao testar conexão com Evolution API:", error);
    return {
      success: false,
      error: error?.message || "Não foi possível alcançar a Evolution API.",
    };
  }
}

// 3. Campaigns CRUD
export async function getWhatsappCampaigns() {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });
      const items = await client.request(
        readItems("campanhas", {
          filter: { canal: { _eq: "whatsapp" } },
          sort: ["-date_created"],
          limit: -1,
        })
      );
      return { success: true, data: toPlainObject(items) };
    });
  } catch (error: any) {
    console.error("Erro em getWhatsappCampaigns:", error);
    return {
      success: false,
      error: "Sem permissão para acessar a coleção 'campanhas' ou ela não existe."
    };
  }
}

export async function saveWhatsappCampaign(data: {
  id?: string;
  nome: string;
  objetivo?: string;
  mensagem: string;
  status: "draft" | "scheduled" | "running" | "paused" | "completed";
  data_envio?: string | null;
}) {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });
      const { id, ...payload } = data;

      const dataToSend = {
        ...payload,
        canal: "whatsapp",
      };

      let result;
      if (id) {
        result = await client.request(updateItem("campanhas", id, dataToSend));
      } else {
        result = await client.request(createItem("campanhas", dataToSend));
      }

      revalidatePath("/marketing/whatsapp");
      return { success: true, data: toPlainObject(result) };
    });
  } catch (error: any) {
    console.error("Erro em saveWhatsappCampaign:", error);
    return {
      success: false,
      error: "Você não tem permissão para salvar campanhas ou a coleção não existe."
    };
  }
}

export async function deleteWhatsappCampaign(id: string) {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });
      await client.request(deleteItem("campanhas", id));
      revalidatePath("/marketing/whatsapp");
      return { success: true };
    });
  } catch (error: any) {
    console.error("Erro em deleteWhatsappCampaign:", error);
    return {
      success: false,
      error: "Você não tem permissão para excluir esta campanha ou a coleção não existe."
    };
  }
}

// 4. Beneficiaries List (Target Audience)
export async function getBeneficiariasList() {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });
      const items: any = await client.request(
        readItems("beneficiarias", {
          fields: ["id", "nome_completo", "nome_social", "telefone", "cpf"],
          limit: -1,
          sort: ["nome_completo"],
        })
      );

      console.log("DEBUG getBeneficiariasList - items:", {
        type: typeof items,
        isArray: Array.isArray(items),
        keys: items ? Object.keys(items) : null,
        preview: items ? JSON.stringify(items).substring(0, 500) : null
      });

      // Filter beneficiaries that have a phone number
      const filtered = (Array.isArray(items) ? items : []).filter(
        (b: any) => b.telefone && b.telefone.replace(/\D/g, "").length >= 8
      );

      return { success: true, data: toPlainObject(filtered) };
    });
  } catch (error: any) {
    console.error("Erro em getBeneficiariasList:", error);
    return {
      success: false,
      error: "Você não tem permissão para listar as beneficiárias ou a coleção não existe."
    };
  }
}


// 5. Dispatch History Logs
export async function getDispatchLogs() {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });
      const items = await client.request(
        readItems("disparos", {
          fields: [
            "id",
            "status",
            "data_envio",
            "date_created",
            "campanha_id.id",
            "campanha_id.nome",
            "beneficiaria_id.id",
            "beneficiaria_id.nome_completo",
            "beneficiaria_id.telefone",
          ],
          sort: ["-date_created"],
          limit: 100, // Show last 100 logs
        })
      );
      return { success: true, data: toPlainObject(items) };
    });
  } catch (error: any) {
    console.error("Erro em getDispatchLogs:", error);
    return {
      success: false,
      error: "Sem permissão para acessar a coleção 'disparos' ou ela não existe."
    };
  }
}

// Helper to format phone number for Brazilian WhatsApp
function formatWhatsappNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");

  // If no country code, prepend 55 (Brazil)
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = "55" + cleaned;
  }

  // Ensure 13 digits for Brazilian mobile (some regions don't use 9th digit on WhatsApp,
  // but Evolution API usually expects the number as it is on WhatsApp)
  return cleaned;
}

// 6. Trigger WhatsApp dispatch to list of beneficiaries
export async function triggerCampaignDispatch(
  campaignId: string,
  beneficiaryIds: string[]
) {
  try {
    const client = await getDirectusClient({ requireAuth: true });

    // 1. Fetch campaign message template
    const campaign = await client.request(readItem("campanhas", campaignId));
    if (!campaign || !campaign.mensagem) {
      return { success: false, error: "Campanha ou mensagem não encontrada." };
    }

    // Update status to running
    await client.request(
      updateItem("campanhas", campaignId, {
        status: "running",
        data_envio: new Date().toISOString(),
      })
    );

    // 2. Fetch beneficiaries details
    const beneficiaries = await client.request(
      readItems("beneficiarias", {
        fields: ["id", "nome_completo", "nome_social", "telefone"],
        filter: { id: { _in: beneficiaryIds } },
        limit: -1,
      })
    );

    // 3. Get WhatsApp Settings
    const configResult = await getWhatsappConfig();
    const config = configResult.success ? configResult.data : null;

    const useEvolution = !!(
      config?.evolution_api_url &&
      config?.evolution_api_token &&
      config?.evolution_api_instance
    );
    const useN8n = !!config?.n8n_webhook_url;

    if (!useEvolution && !useN8n) {
      // Revert status to draft
      await client.request(
        updateItem("campanhas", campaignId, { status: "draft" })
      );
      return {
        success: false,
        error: "Configurações de disparo incompletas. Configure a Evolution API ou n8n Webhook.",
      };
    }

    // 4. Send messages and log them
    const results = [];
    let successCount = 0;
    let failedCount = 0;

    // Send payload to n8n if Webhook is configured
    if (useN8n) {
      try {
        const payload = {
          campaignId,
          campaignName: campaign.nome,
          messageTemplate: campaign.mensagem,
          recipients: beneficiaries.map((b: any) => ({
            id: b.id,
            nome: b.nome_social || b.nome_completo,
            telefone: b.telefone,
            formattedPhone: formatWhatsappNumber(b.telefone),
          })),
        };

        fetch(config.n8n_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((err) => console.error("Falha silenciosa ao chamar n8n:", err));
      } catch (err) {
        console.error("Erro ao notificar webhook n8n:", err);
      }
    }

    // If Evolution API is configured, send directly and log status
    if (useEvolution) {
      const cleanUrl = config.evolution_api_url.replace(/\/$/, "");
      const sendUrl = `${cleanUrl}/message/sendText/${config.evolution_api_instance}`;

      for (const b of beneficiaries) {
        const phone = b.telefone;
        if (!phone) continue;

        const formattedPhone = formatWhatsappNumber(phone);
        const name = b.nome_social || b.nome_completo;
        const firstName = name.split(" ")[0];

        // Format message parameters
        const customizedMessage = campaign.mensagem
          .replace(/{nome_completo}/g, name)
          .replace(/{primeiro_nome}/g, firstName)
          .replace(/{whatsapp}/g, phone);

        let sentSuccess = false;

        try {
          const apiRes = await fetch(sendUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: config.evolution_api_token,
            },
            body: JSON.stringify({
              number: formattedPhone,
              text: customizedMessage,
            }),
          });

          if (apiRes.ok) {
            sentSuccess = true;
            successCount++;
          } else {
            const errLog = await apiRes.text().catch(() => "");
            console.error(`Erro Evolution API para ${phone}:`, errLog);
            failedCount++;
          }
        } catch (apiErr) {
          console.error(`Erro ao disparar Evolution para ${phone}:`, apiErr);
          failedCount++;
        }

        // Log result in Directus
        await client.request(
          createItem("disparos", {
            campanha_id: campaignId,
            beneficiaria_id: b.id,
            status: sentSuccess ? "sent" : "failed",
            data_envio: new Date().toISOString(),
          })
        );
      }
    } else {
      // If only n8n is used, assume sent/scheduled via n8n
      for (const b of beneficiaries) {
        await client.request(
          createItem("disparos", {
            campanha_id: campaignId,
            beneficiaria_id: b.id,
            status: "sent",
            data_envio: new Date().toISOString(),
          })
        );
        successCount++;
      }
    }

    // Set campaign as completed
    await client.request(
      updateItem("campanhas", campaignId, { status: "completed" })
    );

    revalidatePath("/marketing/whatsapp");
    return {
      success: true,
      successCount,
      failedCount,
      total: beneficiaries.length,
    };
  } catch (error: any) {
    console.error("Erro no disparo da campanha:", error);
    return { success: false, error: error?.message || "Erro desconhecido ao processar disparos." };
  }
}
