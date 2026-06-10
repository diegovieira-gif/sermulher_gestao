import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Campanhas Automáticas
// Nodes   : 2  |  Connections: 1
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ScheduleTrigger                    scheduleTrigger
// HttprunCampanhas                   httpRequest
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ScheduleTrigger
//    → HttprunCampanhas
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'CCGLNJ1HLtBtxri4',
    name: 'Campanhas Automáticas',
    active: false,
    isArchived: false,
    settings: { executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', availableInMCP: false },
})
export class CampanhasAutomaticasWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'a1000000-0000-4000-8000-000000000001',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.2,
        position: [0, 0],
    })
    ScheduleTrigger = {
        rule: {
            interval: [
                {
                    field: 'cronExpression',
                    expression: '5 * * * *',
                },
            ],
        },
    };

    @node({
        id: 'a1000000-0000-4000-8000-000000000002',
        name: 'HttpRun Campanhas',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [240, 0],
    })
    HttprunCampanhas = {
        method: 'POST',
        url: 'http://192.168.0.118:3002/api/campanhas/automaticas/run',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'x-cron-secret',
                    value: '={{ $env.CRON_SECRET }}',
                },
            ],
        },
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ScheduleTrigger.out(0).to(this.HttprunCampanhas.in(0));
    }
}
