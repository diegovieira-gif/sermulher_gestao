import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Avaliação Google
// Nodes   : 9  |  Connections: 10
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Webhook                            webhook
// SplitRecipients                    code
// LoopOverItemsSplitInBatches        splitInBatches
// FormatPhoneNumber                  code
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
//        → FormatPhoneNumber
//          → Wait
//            → HttprequestGowa
//              → UpdateDirectusSuccess
//                → LoopOverItemsSplitInBatches (↩ loop)
//              → UpdateDirectusFailure
//                → LoopOverItemsSplitInBatches (↩ loop)
//       .out(1) → UpdateCampaignCompleted
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
        jsCode: `const payload = $('Webhook').item.json;
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
        position: [512, -144],
    })
    FormatPhoneNumber = {
        jsCode: `return items.map(item => {
  let phone = item.json.telefone || '';
  let cleaned = phone.replace(/\\D/g, "");
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = "55" + cleaned;
  }
  item.json.formattedPhone = cleaned;
  return item;
});`,
    };

    @node({
        id: 'd643c286-f994-4197-b585-2ac1a86beded',
        webhookId: '5d307558-0d16-4037-a0e8-c2d0600375b5',
        name: 'Wait',
        type: 'n8n-nodes-base.wait',
        version: 1.1,
        position: [688, -144],
    })
    Wait = {
        amount: 25,
    };

    @node({
        id: 'e643c286-f994-4197-b585-2ac1a86beded',
        name: 'HttpRequest GoWA',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [864, -144],
        onError: 'continueErrorOutput',
    })
    HttprequestGowa = {
        method: 'POST',
        url: '={{ $json.config.gowa_url.replace(/\\/$/, "") }}/send/message',
        sendHeaders: true,
        specifyHeaders: 'json',
        jsonHeaders:
            '={{ JSON.stringify({ "Content-Type": "application/json", "Authorization": "Basic " + Buffer.from($json.config.gowa_basic_auth).toString("base64") }) }}',
        sendBody: true,
        specifyBody: 'json',
        jsonBody:
            '={{ JSON.stringify({ "phone": $json.formattedPhone + "@s.whatsapp.net", "message": $json.messageTemplate.replace(/{nome_completo}/g, $json.nome).replace(/{primeiro_nome}/g, $json.nome.split(" ")[0]).replace(/{whatsapp}/g, $json.telefone) }) }}',
        options: {},
    };

    @node({
        id: 'f643c286-f994-4197-b585-2ac1a86beded',
        name: 'Update Directus Success',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1056, -384],
    })
    UpdateDirectusSuccess = {
        method: 'PATCH',
        url: '={{ $json.directus.url }}/items/disparos/{{ $json.disparo_id }}',
        sendHeaders: true,
        specifyHeaders: 'json',
        jsonHeaders:
            '={{ JSON.stringify({ "Content-Type": "application/json", "Authorization": "Bearer " + $json.directus.token }) }}',
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
        position: [1136, 0],
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
        url: '={{ $("Webhook").item.json.directus.url }}/items/campanhas/{{ $("Webhook").item.json.campaignId }}',
        sendHeaders: true,
        specifyHeaders: 'json',
        jsonHeaders:
            '={{ JSON.stringify({ "Content-Type": "application/json", "Authorization": "Bearer " + $("Webhook").item.json.directus.token }) }}',
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
        this.LoopOverItemsSplitInBatches.out(0).to(this.FormatPhoneNumber.in(0));
        this.LoopOverItemsSplitInBatches.out(1).to(this.UpdateCampaignCompleted.in(0));
        this.FormatPhoneNumber.out(0).to(this.Wait.in(0));
        this.Wait.out(0).to(this.HttprequestGowa.in(0));
        this.HttprequestGowa.out(0).to(this.UpdateDirectusSuccess.in(0));
        this.HttprequestGowa.error().to(this.UpdateDirectusFailure.in(0));
        this.UpdateDirectusSuccess.out(0).to(this.LoopOverItemsSplitInBatches.in(0));
        this.UpdateDirectusFailure.out(0).to(this.LoopOverItemsSplitInBatches.in(0));
    }
}
