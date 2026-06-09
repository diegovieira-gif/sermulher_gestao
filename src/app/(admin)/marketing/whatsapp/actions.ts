"use server";

import { revalidatePath } from "next/cache";
import { getDirectusClient, safeDirectusCall } from "@/lib/directus";
import {
  readItems,
  createItem,
  createItems,
  updateItem,
  deleteItem,
  readItem,
  readMe,
  readSingleton,
  updateSingleton,
  aggregate,
} from "@directus/sdk";

// Filtro base de elegibilidade: beneficiária com telefone preenchido.
// Observação: o Directus rejeita `_neq: ""`; usar `_nempty` (cobre nulo e vazio).
const ELIGIBLE_FILTER = { telefone: { _nempty: true } } as const;

// Considera elegível quem tem ao menos 8 dígitos no telefone.
function temTelefoneValido(b: { telefone?: string | null }): boolean {
  return !!b.telefone && b.telefone.replace(/\D/g, "").length >= 8;
}

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

      const configItem = await client.request(
        readSingleton("configuracoes_site", {
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
        data: configItem ? toPlainObject(configItem) : null,
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

      const result = await client.request(
        updateSingleton("configuracoes_site", payload)
      );

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


// Helper: monta o header Authorization Basic do GoWA a partir do token
// guardado no formato "usuario:senha".
function gowaAuthHeader(token: string): string {
  return "Basic " + Buffer.from(token).toString("base64");
}

// 2. Test connection with GoWA (go-whatsapp-web-multidevice)
// Reaproveita os campos de config:
//   url   = URL base do GoWA (ex.: http://192.168.0.118:3000)
//   token = credenciais Basic Auth no formato "usuario:senha"
//   instance = ignorado (o GoWA mantém 1 sessão por container)
export async function testEvolutionConnection(config: {
  url: string;
  token: string;
  instance?: string;
}) {
  try {
    const { url, token } = config;
    if (!url || !token) {
      return { success: false, error: "Parâmetros de conexão incompletos." };
    }

    const cleanUrl = url.replace(/\/$/, "");
    const testUrl = `${cleanUrl}/app/devices`;

    const res = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: gowaAuthHeader(token),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return {
        success: false,
        error: `GoWA respondeu com status ${res.status}: ${errorText || "Sem resposta"}`,
      };
    }

    const data = await res.json();
    // GoWA: { code: "SUCCESS", results: [{ name, device }] }
    const devices = Array.isArray(data?.results) ? data.results : [];
    const isConnected = devices.length > 0;

    return {
      success: true,
      state: isConnected ? "open" : "disconnected",
      isConnected,
      raw: data,
    };
  } catch (error: any) {
    console.error("Erro ao testar conexão com o GoWA:", error);
    return {
      success: false,
      error: error?.message || "Não foi possível alcançar o GoWA.",
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

// 4. Público-alvo (audiência)

// 4a. Contagem leve de beneficiárias elegíveis (com telefone) — usada na UI
// sem precisar trafegar milhares de registros.
export async function getEligibleBeneficiariasCount() {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });
      const res: any = await client.request(
        aggregate("beneficiarias", {
          aggregate: { count: "*" },
          query: { filter: ELIGIBLE_FILTER },
        })
      );
      const count =
        Array.isArray(res) && res[0]?.count ? Number(res[0].count) : 0;
      return { success: true, count };
    });
  } catch (error: any) {
    console.error("Erro em getEligibleBeneficiariasCount:", error);
    return {
      success: false,
      count: 0,
      error: "Não foi possível contar as beneficiárias elegíveis.",
    };
  }
}

// 4b. Busca server-side, limitada a 50 resultados, para seleção manual.
// Evita carregar a lista completa (milhares) no navegador.
export async function searchBeneficiarias(query: string) {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });
      const q = (query || "").trim();

      const filter: any = { ...ELIGIBLE_FILTER };
      if (q) {
        filter._or = [
          { nome_completo: { _icontains: q } },
          { nome_social: { _icontains: q } },
          { telefone: { _contains: q } },
        ];
      }

      const items: any = await client.request(
        readItems("beneficiarias", {
          fields: ["id", "nome_completo", "nome_social", "telefone", "cpf"],
          filter,
          sort: ["nome_completo"],
          limit: 50,
        })
      );

      const list = (Array.isArray(items) ? items : []).filter(
        temTelefoneValido
      );
      return { success: true, data: toPlainObject(list) };
    });
  } catch (error: any) {
    console.error("Erro em searchBeneficiarias:", error);
    return {
      success: false,
      error: "Não foi possível buscar as beneficiárias.",
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
            "detalhes_erro",
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

// 6. Trigger WhatsApp dispatch
// target:
//   { mode: "all" }                 → todas as beneficiárias elegíveis
//   { mode: "selected", ids: [...] } → apenas as selecionadas
export type DispatchTarget =
  | { mode: "all" }
  | { mode: "selected"; ids: string[] };

export async function triggerCampaignDispatch(
  campaignId: string,
  target: DispatchTarget
) {
  try {
    const client = await getDirectusClient({ requireAuth: true });

    // 1. Fetch campaign message template
    const campaign = await client.request(readItem("campanhas", campaignId));
    if (!campaign || !campaign.mensagem) {
      return { success: false, error: "Campanha ou mensagem não encontrada." };
    }

    // 2. Fetch beneficiaries details conforme o modo de público
    let beneficiariesRaw: any[];
    if (target.mode === "selected") {
      if (!target.ids || target.ids.length === 0) {
        return {
          success: false,
          error: "Selecione pelo menos uma beneficiária para envio.",
        };
      }
      beneficiariesRaw = await client.request(
        readItems("beneficiarias", {
          fields: ["id", "nome_completo", "nome_social", "telefone"],
          filter: { id: { _in: target.ids } },
          limit: -1,
        })
      );
    } else {
      beneficiariesRaw = await client.request(
        readItems("beneficiarias", {
          fields: ["id", "nome_completo", "nome_social", "telefone"],
          filter: ELIGIBLE_FILTER,
          limit: -1,
        })
      );
    }

    // Garante elegibilidade (telefone com ao menos 8 dígitos)
    const beneficiaries = (
      Array.isArray(beneficiariesRaw) ? beneficiariesRaw : []
    ).filter(temTelefoneValido);

    if (beneficiaries.length === 0) {
      return {
        success: false,
        error: "Nenhuma beneficiária elegível (com telefone válido) encontrada.",
      };
    }

    // 3. Get WhatsApp Settings
    const configResult = await getWhatsappConfig();
    const config = configResult.success ? configResult.data : null;

    // GoWA precisa apenas de URL base + credenciais Basic Auth (usuario:senha).
    const useGowa = !!(config?.evolution_api_url && config?.evolution_api_token);
    const useN8n = !!config?.n8n_webhook_url;

    if (!useGowa && !useN8n) {
      return {
        success: false,
        error: "Configurações de disparo incompletas. Configure o GoWA ou o Webhook do n8n.",
      };
    }

    const isBatch = beneficiaries.length > 1;

    // --- CASE A: BATCH DISPATCH (MORE THAN 1 RECIPIENT) ---
    if (isBatch && useN8n) {
      // Update campaign status to running
      await client.request(
        updateItem("campanhas", campaignId, {
          status: "running",
          data_envio: new Date().toISOString(),
        })
      );

      // Create disparos logs in Directus as "scheduled"
      const dataToCreate = beneficiaries.map((b: any) => ({
        campanha_id: campaignId,
        beneficiaria_id: b.id,
        status: "scheduled",
      }));
      
      const createdDisparos: any = await client.request(createItems("disparos", dataToCreate));

      // Prepare payload for n8n
      const payload = {
        campaignId,
        campaignName: campaign.nome,
        messageTemplate: campaign.mensagem,
        directus: {
          url: process.env.DIRECTUS_API_URL,
          token: process.env.DIRECTUS_TOKEN
        },
        config: {
          gowa_url: config.evolution_api_url,
          // credenciais Basic Auth no formato "usuario:senha"
          gowa_basic_auth: config.evolution_api_token,
        },
        recipients: beneficiaries.map((b: any, index: number) => ({
          disparo_id: createdDisparos[index].id,
          beneficiaria_id: b.id,
          nome: b.nome_social || b.nome_completo,
          telefone: b.telefone,
          formattedPhone: formatWhatsappNumber(b.telefone),
        })),
      };

      try {
        const res = await fetch(config.n8n_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`n8n webhook respondeu com ${res.status}`);
        }
      } catch (err: any) {
        console.error("Erro ao chamar n8n webhook:", err);
        // Revert campaign status to draft and delete the created disparos
        await client.request(updateItem("campanhas", campaignId, { status: "draft" }));
        return {
          success: false,
          error: `Falha ao acionar o n8n para disparo em lote: ${err.message || err}`,
        };
      }

      revalidatePath("/marketing/whatsapp");
      return {
        success: true,
        successCount: 0,
        failedCount: 0,
        total: beneficiaries.length,
        isBatchN8n: true,
      };
    }

    // --- CASE B: INDIVIDUAL DISPATCH OR FALLBACK BATCH ---
    // (If it is a single contact OR if it's a batch but n8n is not configured)

    // Pré-checagem: se vamos enviar diretamente pelo GoWA, garantir que há um
    // dispositivo logado (sessão ativa). Evita falhas confusas quando o WhatsApp
    // está desconectado/sem QR pareado.
    if (useGowa) {
      const conn = await testEvolutionConnection({
        url: config.evolution_api_url,
        token: config.evolution_api_token,
      });
      if (!conn.success || !conn.isConnected) {
        return {
          success: false,
          error: `O WhatsApp não está conectado no GoWA (estado: ${
            (conn as any).state || "desconhecido"
          }). Faça o login/QR Code no painel do GoWA e tente novamente.`,
        };
      }
    }

    await client.request(
      updateItem("campanhas", campaignId, {
        status: "running",
        data_envio: new Date().toISOString(),
      })
    );

    let successCount = 0;
    let failedCount = 0;

    const cleanUrl = config.evolution_api_url?.replace(/\/$/, "");
    const sendUrl = `${cleanUrl}/send/message`;

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
      let errorDetails = null;

      if (useGowa) {
        try {
          const apiRes = await fetch(sendUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: gowaAuthHeader(config.evolution_api_token),
            },
            body: JSON.stringify({
              phone: `${formattedPhone}@s.whatsapp.net`,
              message: customizedMessage,
            }),
          });

          if (apiRes.ok) {
            sentSuccess = true;
            successCount++;
          } else {
            const errLog = await apiRes.text().catch(() => "");
            errorDetails = `GoWA ${apiRes.status}: ${errLog || "Sem resposta"}`;
            console.error(`Erro GoWA para ${phone}:`, errLog);
            failedCount++;
          }
        } catch (apiErr: any) {
          errorDetails = `Falha de rede/conexão: ${apiErr?.message || apiErr}`;
          console.error(`Erro ao disparar GoWA para ${phone}:`, apiErr);
          failedCount++;
        }
      } else {
        // Only n8n configured but doing individual fallback (or similar)
        // We will mock/call n8n for this single recipient
        try {
          const res = await fetch(config.n8n_webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              campaignId,
              campaignName: campaign.nome,
              messageTemplate: campaign.mensagem,
              directus: {
                url: process.env.DIRECTUS_API_URL,
                token: process.env.DIRECTUS_TOKEN
              },
              config: {
                gowa_url: config.evolution_api_url,
                gowa_basic_auth: config.evolution_api_token,
              },
              recipients: [{
                disparo_id: null,
                beneficiaria_id: b.id,
                nome: name,
                telefone: phone,
                formattedPhone,
              }]
            }),
          });
          if (res.ok) {
            sentSuccess = true;
            successCount++;
          } else {
            errorDetails = `n8n webhook respondeu com ${res.status}`;
            failedCount++;
          }
        } catch (err: any) {
          errorDetails = `Falha ao acionar n8n: ${err?.message || err}`;
          failedCount++;
        }
      }

      // Log result in Directus
      await client.request(
        createItem("disparos", {
          campanha_id: campaignId,
          beneficiaria_id: b.id,
          status: sentSuccess ? "sent" : "failed",
          data_envio: new Date().toISOString(),
          detalhes_erro: errorDetails,
        })
      );
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
