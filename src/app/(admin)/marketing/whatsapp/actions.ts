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

// Resolve o JID canônico do número no WhatsApp via GoWA /user/check.
// Resolve o problema do "9º dígito" brasileiro: o número discável tem o 9 extra
// (5579999800850), mas a conta no WhatsApp pode estar registrada sem ele
// (557999800850). Enviar para o JID errado = mensagem não entregue.
// Retorna o JID canônico (ex.: "557999800850@s.whatsapp.net") ou null se o
// número não estiver no WhatsApp / a checagem falhar.
async function resolveGowaJid(
  cleanUrl: string,
  token: string,
  digits: string
): Promise<{ jid: string | null; onWhatsapp: boolean; checked: boolean }> {
  try {
    const res = await fetch(
      `${cleanUrl}/user/check?phone=${encodeURIComponent(digits)}`,
      {
        method: "GET",
        headers: { Authorization: gowaAuthHeader(token) },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      return { jid: null, onWhatsapp: false, checked: false };
    }
    const data = await res.json().catch(() => null);
    const r = data?.results ?? data ?? {};
    const onWhatsapp = !!(r.is_on_whatsapp ?? r.isOnWhatsApp);
    let jid: string | null = r.jid || r.JID || null;
    if (jid && !jid.includes("@")) {
      jid = `${jid}@s.whatsapp.net`;
    }
    return { jid, onWhatsapp, checked: true };
  } catch {
    return { jid: null, onWhatsapp: false, checked: false };
  }
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
    const headers = {
      "Content-Type": "application/json",
      Authorization: gowaAuthHeader(token),
    };

    // Endpoint principal: /app/status retorna { results: { is_connected, is_logged_in, jid } }.
    // Fallback: /app/devices (versões mais antigas) retorna { results: [ { device } ] }.
    const statusRes = await fetch(`${cleanUrl}/app/status`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (statusRes.ok) {
      const data = await statusRes.json();
      const r = data?.results ?? {};
      const isConnected = !!(r.is_logged_in ?? r.is_connected);
      return {
        success: true,
        state: r.is_logged_in
          ? "open"
          : r.is_connected
            ? "connecting"
            : "disconnected",
        isConnected,
        raw: data,
      };
    }

    // /app/status indisponível → tenta /app/devices
    const devicesRes = await fetch(`${cleanUrl}/app/devices`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (devicesRes.ok) {
      const data = await devicesRes.json();
      const devices = Array.isArray(data?.results) ? data.results : [];
      const isConnected = devices.length > 0;
      return {
        success: true,
        state: isConnected ? "open" : "disconnected",
        isConnected,
        raw: data,
      };
    }

    const errorText = await statusRes.text().catch(() => "");
    return {
      success: false,
      error: `GoWA em ${cleanUrl} respondeu ${statusRes.status} em /app/status${
        errorText ? `: ${errorText}` : ""
      }. Verifique se a URL aponta para o GoWA (e não para um proxy/outro serviço).`,
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

// 4a-bis. Filtros estruturados de público-alvo
// Cada campo é opcional; quando ausente/vazio, não restringe o público.
export type BeneficiariaFilter = {
  busca?: string | null;
  status?: string | null; // 'ativa' | 'arquivada'
  raca_cor_id?: number[];
  estado_civil_id?: number[];
  escolaridade_id?: number[];
  situacao_trabalho_id?: number[];
  bairro?: number[];
  recebe_bolsa_familia?: boolean | null;
  recebe_bpc?: boolean | null;
  possui_medida_protetiva?: boolean | null;
  filhos_min?: number | null;
  filhos_max?: number | null;
  idade_min?: number | null;
  idade_max?: number | null;
};

// Subtrai N anos da data de hoje e devolve no formato YYYY-MM-DD.
function dateMinusYears(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

// Monta o filtro do Directus a partir do filtro estruturado, sempre
// combinando com a elegibilidade base (telefone preenchido).
function buildBeneficiariaFilter(f?: BeneficiariaFilter): Record<string, any> {
  const and: any[] = [{ ...ELIGIBLE_FILTER }];
  if (!f) return { _and: and };

  const inList = (field: string, ids?: number[]) => {
    const clean = (ids || []).filter((v) => v !== null && v !== undefined);
    if (clean.length > 0) and.push({ [field]: { _in: clean } });
  };

  inList("raca_cor_id", f.raca_cor_id);
  inList("estado_civil_id", f.estado_civil_id);
  inList("escolaridade_id", f.escolaridade_id);
  inList("situacao_trabalho_id", f.situacao_trabalho_id);
  inList("bairro", f.bairro);

  if (f.status && f.status.trim() !== "") {
    and.push({ status: { _eq: f.status } });
  }

  const boolFilter = (field: string, val?: boolean | null) => {
    if (val === true || val === false) and.push({ [field]: { _eq: val } });
  };
  boolFilter("recebe_bolsa_familia", f.recebe_bolsa_familia);
  boolFilter("recebe_bpc", f.recebe_bpc);
  boolFilter("possui_medida_protetiva", f.possui_medida_protetiva);

  if (typeof f.filhos_min === "number")
    and.push({ quantidade_filhos: { _gte: f.filhos_min } });
  if (typeof f.filhos_max === "number")
    and.push({ quantidade_filhos: { _lte: f.filhos_max } });

  // Idade -> faixa de data_nascimento.
  // idade >= idade_min  => nasceu até (hoje - idade_min anos)
  if (typeof f.idade_min === "number")
    and.push({ data_nascimento: { _lte: dateMinusYears(f.idade_min) } });
  // idade <= idade_max  => nasceu depois de (hoje - (idade_max + 1) anos)
  if (typeof f.idade_max === "number")
    and.push({ data_nascimento: { _gte: dateMinusYears(f.idade_max + 1) } });

  const q = (f.busca || "").trim();
  if (q) {
    and.push({
      _or: [
        { nome_completo: { _icontains: q } },
        { nome_social: { _icontains: q } },
        { telefone: { _contains: q } },
        { cpf: { _contains: q } },
      ],
    });
  }

  return { _and: and };
}

// 4a-ter. Opções para os selects de filtro (tabelas de configuração).
export async function getBeneficiariaFilterOptions() {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });
      const [racas, estadosCivis, escolaridades, situacoesTrabalho, bairros] =
        await Promise.all([
          client.request(
            readItems("config_raca_cor", { fields: ["id", "nome"], sort: ["nome"] })
          ),
          client.request(
            readItems("config_estado_civil", { fields: ["id", "nome"], sort: ["nome"] })
          ),
          client.request(
            readItems("config_escolaridade", { fields: ["id", "nome"], sort: ["nome"] })
          ),
          client.request(
            readItems("config_situacao_trabalho", { fields: ["id", "nome"], sort: ["nome"] })
          ),
          client.request(
            readItems("config_bairros", { fields: ["id", "nome"], sort: ["nome"] })
          ),
        ]);
      return {
        success: true,
        data: toPlainObject({
          racas,
          estadosCivis,
          escolaridades,
          situacoesTrabalho,
          bairros,
        }),
      };
    });
  } catch (error: any) {
    console.error("Erro em getBeneficiariaFilterOptions:", error);
    return { success: false, data: null, error: "Não foi possível carregar as opções de filtro." };
  }
}

// 4a-quater. Contagem de beneficiárias que atendem ao filtro (preview ao vivo).
export async function getBeneficiariasCountForFilter(filter?: BeneficiariaFilter) {
  try {
    return await safeDirectusCall(async () => {
      const client = await getDirectusClient({ requireAuth: true });
      const res: any = await client.request(
        aggregate("beneficiarias", {
          aggregate: { count: "*" },
          query: { filter: buildBeneficiariaFilter(filter) },
        })
      );
      const count =
        Array.isArray(res) && res[0]?.count ? Number(res[0].count) : 0;
      return { success: true, count };
    });
  } catch (error: any) {
    console.error("Erro em getBeneficiariasCountForFilter:", error);
    return {
      success: false,
      count: 0,
      error: "Não foi possível contar as beneficiárias para este filtro.",
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

  // Regra do 9º dígito brasileiro:
  // O número discável tem o 9 extra (55 + DDD + 9 + 8 dígitos = 13).
  // Porém, contas de WhatsApp em DDDs >= 31 (ex.: Sergipe = 79) normalmente
  // estão registradas SEM esse 9 (55 + DDD + 8 dígitos = 12). O GoWA NÃO
  // corrige isso sozinho — ele envia para o JID exato que recebe. Então
  // removemos o 9 nesses DDDs para acertar o JID canônico e a mensagem chegar.
  if (cleaned.startsWith("55") && cleaned.length === 13) {
    const ddd = parseInt(cleaned.substring(2, 4), 10);
    const ninthDigit = cleaned.charAt(4);
    if (ninthDigit === "9" && ddd >= 31) {
      cleaned = cleaned.substring(0, 4) + cleaned.substring(5);
    }
  }

  return cleaned;
}

// Valida se o número já normalizado tem o formato esperado de celular
// brasileiro: 55 + DDD (11–99) + 8 ou 9 dígitos => 12 ou 13 dígitos no total.
// Usado para marcar entradas malformadas como falha ANTES de chamar o GoWA.
function isValidBrazilianWhatsapp(digits: string): boolean {
  if (!/^55\d{10,11}$/.test(digits)) return false;
  const ddd = parseInt(digits.substring(2, 4), 10);
  return ddd >= 11 && ddd <= 99;
}

// 6. Trigger WhatsApp dispatch
// target:
//   { mode: "all" }                  → todas as beneficiárias elegíveis
//   { mode: "selected", ids: [...] }  → apenas as selecionadas
//   { mode: "filtered", filter }      → as que atendem ao filtro estruturado
export type DispatchTarget =
  | { mode: "all" }
  | { mode: "selected"; ids: string[] }
  | { mode: "filtered"; filter: BeneficiariaFilter };

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
    } else if (target.mode === "filtered") {
      beneficiariesRaw = await client.request(
        readItems("beneficiarias", {
          fields: ["id", "nome_completo", "nome_social", "telefone"],
          filter: buildBeneficiariaFilter(target.filter),
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
          // Valida o formato antes de qualquer chamada ao GoWA.
          if (!isValidBrazilianWhatsapp(formattedPhone)) {
            errorDetails = `Número em formato inválido: ${phone}`;
            console.error(`Número inválido (formato): ${phone} -> ${formattedPhone}`);
            failedCount++;
            await client.request(
              createItem("disparos", {
                campanha_id: campaignId,
                beneficiaria_id: b.id,
                status: "failed",
                data_envio: new Date().toISOString(),
                detalhes_erro: errorDetails,
              })
            );
            continue;
          }

          // Resolve o JID canônico (corrige o 9º dígito brasileiro). Se o número
          // não estiver no WhatsApp, marca como falha sem tentar enviar.
          const resolved = await resolveGowaJid(
            cleanUrl,
            config.evolution_api_token,
            formattedPhone
          );

          if (resolved.checked && !resolved.onWhatsapp) {
            // Número confirmadamente fora do WhatsApp: não tenta enviar.
            errorDetails = "Número não está no WhatsApp";
            console.error(`Número fora do WhatsApp: ${phone}`);
            failedCount++;
          } else {
            const targetJid =
              resolved.jid || `${formattedPhone}@s.whatsapp.net`;

            const apiRes = await fetch(sendUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: gowaAuthHeader(config.evolution_api_token),
              },
              body: JSON.stringify({
                phone: targetJid,
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
