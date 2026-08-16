import { getEventosLista, getGlobalEvents, getTiposOptions } from "./actions";
import { EventosCalendarioClient } from "./eventos-calendario-client";
import { EventosClient } from "./eventos-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

const paraId = (valor?: string) => {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  // 1. Busca dados em paralelo:
  // - Eventos Globais (formatados para o calendário visual)
  // - Opções de Tipos (para os selects)
  // - Lista de gestão: filtros, ordenação e paginação resolvidos no servidor
  const [globalEventsResult, tiposResult, listaResult] = await Promise.all([
    getGlobalEvents(),
    getTiposOptions(),
    getEventosLista({
      page: paraId(sp.page) ?? 1,
      ordenacao: sp.ordem,
      tipoId: paraId(sp.tipo),
      categoria: sp.categoria,
      situacao: sp.situacao,
    }),
  ]);

  // Tratamento de Erro Crítico (apenas se falhar o calendário)
  if (!globalEventsResult.success) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no Calendário</AlertTitle>
          <AlertDescription>
            {globalEventsResult.error ||
              "Não foi possível carregar a agenda unificada."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepara dados com fallbacks seguros
  const tiposOptions =
    tiposResult.success && tiposResult.data ? tiposResult.data : [];
  const eventosTabela =
    listaResult.success && listaResult.data ? listaResult.data : [];

  return (
    <div className="p-6 h-screen flex flex-col bg-gray-50/50">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Agenda Institucional
          </h1>
          <p className="text-gray-500">
            Gestão de eventos, campanhas e calendário escolar unificado.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Componente de Abas.
            `defaultValue` vem da URL para que filtrar, ordenar ou paginar não
            devolva a pessoa ao calendário a cada clique. */}
        <Tabs
          defaultValue={sp.aba === "lista" ? "lista" : "calendario"}
          className="h-full flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger
                value="calendario"
                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
              >
                <Calendar className="h-4 w-4" />
                Calendário Visual
              </TabsTrigger>
              <TabsTrigger
                value="lista"
                className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
              >
                <List className="h-4 w-4" />
                Gestão de Eventos (Lista)
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Aba 1: Calendário */}
          <TabsContent
            value="calendario"
            className="flex-1 mt-0 min-h-0 overflow-hidden animate-in fade-in duration-300"
          >
            <div className="h-full border rounded-xl bg-white shadow-sm overflow-hidden">
              <EventosCalendarioClient
                initialEvents={globalEventsResult.data || []}
                tiposEventoOptions={tiposOptions}
              />
            </div>
          </TabsContent>

          {/* Aba 2: Lista de Gestão (CRUD) */}
          <TabsContent
            value="lista"
            className="flex-1 mt-0 min-h-0 overflow-hidden animate-in fade-in duration-300"
          >
            <div className="bg-white border rounded-xl shadow-sm p-4 h-full overflow-y-auto custom-scrollbar">
              <EventosClient
                eventos={eventosTabela}
                tiposEventoOptions={tiposOptions}
                meta={listaResult.success ? listaResult.meta : undefined}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
