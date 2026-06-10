import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Avaliação Google
// Nodes   : 10  |  Connections: 12
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            webhook
// SplitRecipients                    code
// LoopOverItemsSplitInBatches        splitInBatches
// FormatPhoneNumber                  code
// NumeroValido                       if
// Wait                               wait
// HttprequestGowa                    httpRequest                [onError→out(1)]
// UpdateDirectusSuccess              httpRequest
// UpdateDirectusFailure              httpRequest
// UpdateCampaignCompleted            httpRequest
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Webhook
//    → SplitRecipients
//      → LoopOverItemsSplitInBatches
//        → UpdateCampaignCompleted
//       .out(1) → FormatPhoneNumber
//          → NumeroValido
//            → Wait
//              → HttprequestGowa
//                → UpdateDirectusSuccess
//                  → LoopOverItemsSplitInBatches (↩ loop)
//                → UpdateDirectusFailure
//                  → LoopOverItemsSplitInBatches (↩ loop)
//           .out(1) → UpdateDirectusFailure (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'xao66B48jVYRjztV',
    name: 'Avaliação Google',
    active: true,
    isArchived: false,
    settings: {
        executionOrder: 'v1',
        binaryMode: 'separate',
        availableInMCP: true,
        timeSavedMode: 'fixed',
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class AvaliacaoGoogleWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'a043c286-f994-4197-b585-2ac1a86beded',
        webhookId: '472b468f-dfd1-4642-9ee7-1a11fe365e5c',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [-144, 0],
    })
    Webhook = {
        httpMethod: 'POST',
        path: 'avaliacao-google',
        options: {},
    };

    @node({
        id: 'b643c286-f994-4197-b585-2ac1a86beded',
        name: 'Split Recipients',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [96, 0],
    })
    SplitRecipients = {
        jsCode: `const payload = $('Webhook').item.json.body || $('Webhook').item.json;
return payload.recipients.map(r => ({
  json: {
    ...r,
    campaignId: payload.campaignId,
    campaignName: payload.campaignName,
    messageTemplate: payload.messageTemplate,
    config: payload.config,
    directus: payload.directus
  }
}));`,
    };

    @node({
        id: 'c643c286-f994-4197-b585-2ac1a86beded',
        name: 'Loop Over Items (Split in Batches)',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [384, 0],
    })
    LoopOverItemsSplitInBatches = {
        options: {},
    };

    @node({
        id: 'i643c286-f994-4197-b585-2ac1a86beded',
        name: 'Format Phone Number',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [576, -144],
    })
    FormatPhoneNumber = {
        jsCode: `return items.map(item => {
  let phone = item.json.telefone || '';
  let cleaned = phone.replace(/\\D/g, "");
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = "55" + cleaned;
  }
  // Regra do 9º dígito brasileiro: contas em DDDs >= 31 (ex.: Sergipe = 79)
  // geralmente estão registradas no WhatsApp SEM o 9 extra. O GoWA envia
  // para o JID exato, então removemos o 9 nesses DDDs para a mensagem chegar.
  if (cleaned.startsWith("55") && cleaned.length === 13) {
    const ddd = parseInt(cleaned.substring(2, 4), 10);
    if (cleaned.charAt(4) === "9" && ddd >= 31) {
      cleaned = cleaned.substring(0, 4) + cleaned.substring(5);
    }
  }
  item.json.formattedPhone = cleaned;
  item.json.jid = cleaned + "@s.whatsapp.net";

  // Validação de formato: 55 + DDD (11-99) + 8 ou 9 dígitos (12 ou 13 no total).
  const ddd2 = parseInt(cleaned.substring(2, 4), 10);
  item.json.numeroValido =
    /^55\\d{10,11}$/.test(cleaned) && ddd2 >= 11 && ddd2 <= 99;
  if (!item.json.numeroValido) {
    item.json.message = "Número em formato inválido";
  }

  // Base64 do Basic Auth montado aqui: 'Buffer' não existe nas expressões
  // do n8n (apenas em nós Code), então pré-calculamos o header.
  const basic = (item.json.config && item.json.config.gowa_basic_auth) || "";
  item.json.authHeader = "Basic " + Buffer.from(basic).toString("base64");

  // Monta a mensagem final aqui (JS puro) para evitar regex com chaves
  // dentro da expressão do nó HTTP, que quebra o parser do n8n.
  const name = item.json.nome || "";
  const firstName = name.split(" ")[0] || "";
  const tpl = item.json.messageTemplate || "";
  item.json.finalMessage = tpl
    .replace(/{nome_completo}/g, name)
    .replace(/{primeiro_nome}/g, firstName)
    .replace(/{whatsapp}/g, item.json.telefone || "");

  return item;
});`,
    };

    @node({
        id: 'j643c286-f994-4197-b585-2ac1a86beded',
        name: 'Numero Valido?',
        type: 'n8n-nodes-base.if',
        version: 2,
        position: [688, -144],
    })
    NumeroValido = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
            },
            combinator: 'and',
            conditions: [
                {
                    id: 'cond-numero-valido',
                    leftValue: '={{ $json.numeroValido }}',
                    rightValue: '',
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'd643c286-f994-4197-b585-2ac1a86beded',
        webhookId: '5d307558-0d16-4037-a0e8-c2d0600375b5',
        name: 'Wait',
        type: 'n8n-nodes-base.wait',
        version: 1.1,
        position: [784, -144],
    })
    Wait = {
        amount: 25,
    };

    @node({
        id: 'e643c286-f994-4197-b585-2ac1a86beded',
        name: 'HttpRequest GoWA',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1008, -144],
        onError: 'continueErrorOutput',
    })
    HttprequestGowa = {
        method: 'POST',
        url: '={{ $json.config.gowa_url.replace(/\\/$/, "") }}/send/message',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Content-Type',
                    value: 'application/json',
                },
                {
                    name: 'Authorization',
                    value: '={{ $json.authHeader }}',
                },
            ],
        },
        sendBody: true,
        bodyParameters: {
            parameters: [
                {
                    name: 'phone',
                    value: '={{ $json.jid }}',
                },
                {
                    name: 'message',
                    value: '={{ $json.finalMessage }}',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'f643c286-f994-4197-b585-2ac1a86beded',
        name: 'Update Directus Success',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1392, -384],
    })
    UpdateDirectusSuccess = {
        method: 'PATCH',
        url: '={{ $("Split Recipients").item.json.directus.url }}/items/disparos/{{ $("Split Recipients").item.json.disparo_id }}',
        sendHeaders: true,
        specifyHeaders: 'json',
        jsonHeaders:
            '={{ JSON.stringify({ "Content-Type": "application/json", "Authorization": "Bearer " + $("Split Recipients").item.json.directus.token }) }}',
        sendBody: true,
        specifyBody: 'json',
        jsonBody:
            '={{ JSON.stringify({ "status": "sent", "data_envio": new Date().toISOString(), "detalhes_erro": null }) }}',
        options: {},
    };

    @node({
        id: 'g643c286-f994-4197-b585-2ac1a86beded',
        name: 'Update Directus Failure',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1408, -16],
    })
    UpdateDirectusFailure = {
        method: 'PATCH',
        url: '={{ $("Split Recipients").item.json.directus.url }}/items/disparos/{{ $("Split Recipients").item.json.disparo_id }}',
        sendHeaders: true,
        specifyHeaders: 'json',
        jsonHeaders:
            '={{ JSON.stringify({ "Content-Type": "application/json", "Authorization": "Bearer " + $("Split Recipients").item.json.directus.token }) }}',
        sendBody: true,
        specifyBody: 'json',
        jsonBody:
            '={{ JSON.stringify({ "status": "failed", "detalhes_erro": $json.message || "Erro desconhecido no GoWA" }) }}',
        options: {},
    };

    @node({
        id: 'h643c286-f994-4197-b585-2ac1a86beded',
        name: 'Update Campaign Completed',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [912, 320],
    })
    UpdateCampaignCompleted = {
        method: 'PATCH',
        url: '={{ ($("Webhook").item.json.body || $("Webhook").item.json).directus.url }}/items/campanhas/{{ ($("Webhook").item.json.body || $("Webhook").item.json).campaignId }}',
        sendHeaders: true,
        specifyHeaders: 'json',
        jsonHeaders:
            '={{ JSON.stringify({ "Content-Type": "application/json", "Authorization": "Bearer " + ($("Webhook").item.json.body || $("Webhook").item.json).directus.token }) }}',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify({ "status": "completed" }) }}',
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Webhook.out(0).to(this.SplitRecipients.in(0));
        this.SplitRecipients.out(0).to(this.LoopOverItemsSplitInBatches.in(0));
        this.LoopOverItemsSplitInBatches.out(0).to(this.UpdateCampaignCompleted.in(0));
        this.LoopOverItemsSplitInBatches.out(1).to(this.FormatPhoneNumber.in(0));
        this.FormatPhoneNumber.out(0).to(this.NumeroValido.in(0));
        this.NumeroValido.out(0).to(this.Wait.in(0));
        this.NumeroValido.out(1).to(this.UpdateDirectusFailure.in(0));
        this.Wait.out(0).to(this.HttprequestGowa.in(0));
        this.HttprequestGowa.out(0).to(this.UpdateDirectusSuccess.in(0));
        this.HttprequestGowa.error().to(this.UpdateDirectusFailure.in(0));
        this.UpdateDirectusSuccess.out(0).to(this.LoopOverItemsSplitInBatches.in(0));
        this.UpdateDirectusFailure.out(0).to(this.LoopOverItemsSplitInBatches.in(0));
    }
}
