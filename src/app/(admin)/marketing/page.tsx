import { GenericCrudTable } from "@/app/(admin)/configuracoes/generic-crud-table";
import {
  getMarketingItems,
  saveMarketingItem,
  deleteMarketingItem,
  getMarketingStats,
} from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Users, MousePointerClick } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  // 1. Busca dados do Backend
  const [itemsResult, stats] = await Promise.all([
    getMarketingItems().catch(() => ({ success: false, data: [] })),
    getMarketingStats().catch(() => ({
      postsMes: 0,
      alcanceMes: 0,
      interacoesMes: 0,
    })),
  ]);

  // Garante array válido
  const items =
    itemsResult && itemsResult.success && Array.isArray(itemsResult.data)
      ? itemsResult.data
      : [];

  return (
    <div className="space-y-6 p-6">
      {/* 2. Cards de KPIs (Resumo do Mês) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Publicações (Mês)
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.postsMes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcance Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.alcanceMes || 0).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.interacoesMes || 0).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Tabela de Gestão */}
      <GenericCrudTable
        key="marketing-table-production" // Força re-render para limpar cache antigo
        title="Gestão de Comunicação"
        data={items}
        onSave={saveMarketingItem}
        onDelete={deleteMarketingItem}
        collectionName="marketing_items"
        // Campos que aparecem na barra de pesquisa
        searchableFields={["titulo", "campanha", "plataforma"]}
        // Definição das Colunas (Validado pelo diagnóstico)
        columns={[
          { key: "data_publicacao", label: "Data" },
          { key: "titulo", label: "Título" },
          { key: "plataforma", label: "Plataforma" },
          { key: "alcance", label: "Alcance" },
          { key: "campanha", label: "Campanha" },
        ]}
        // Definição do Formulário (Inputs)
        formConfig={[
          {
            name: "titulo",
            label: "Título / Manchete",
            type: "text",
            required: true,
            placeholder: "Ex: Divulgação do Curso de Costura",
          },
          {
            name: "data_publicacao",
            label: "Data da Publicação",
            type: "date",
            required: true,
          },
          {
            name: "plataforma",
            label: "Plataforma",
            type: "select",
            required: true,
            options: [
              { label: "Instagram", value: "instagram" },
              { label: "Facebook", value: "facebook" },
              { label: "LinkedIn", value: "linkedin" },
              { label: "Site Oficial", value: "site" },
              { label: "Jornal/Revista", value: "jornal" },
              { label: "TV/Rádio", value: "midia_tradicional" },
              { label: "Outros", value: "outros" },
            ],
          },
          {
            name: "link",
            label: "Link (URL)",
            type: "text",
            required: false,
            placeholder: "https://...",
          },
          {
            name: "alcance",
            label: "Alcance (Visualizações)",
            type: "number",
            required: false,
            placeholder: "0",
          },
          {
            name: "interacoes",
            label: "Interações (Likes/Coment.)",
            type: "number",
            required: false,
            placeholder: "0",
          },
          {
            name: "campanha",
            label: "Campanha / Evento",
            type: "text",
            required: false,
            placeholder: "Ex: Outubro Rosa",
          },
        ]}
      />
    </div>
  );
}
