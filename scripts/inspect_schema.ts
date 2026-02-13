
import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";

async function inspect() {
    try {
        const tramitacao = await directus.request(readItems('tramitacoes', { limit: 1 }));
        console.log('Tramitacao:', JSON.stringify(tramitacao, null, 2));

        // Also check if we can expand sector
        // The user mentioned "setor_responsavel.nome"
        // So likely there is a relation "setor_responsavel"

    } catch (error) {
        console.error('Error:', error);
    }
}

inspect();
