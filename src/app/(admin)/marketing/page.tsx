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
  // Busca dados em paralelo
  const [itemsResult, stats] = await Promise.all([
    getMarketingItems(),
    getMarketingStats(),
  ]);

  const items = itemsResult.success ? itemsResult.data : [];

  return (
    <div className="space-y-6 p-6">
      {/* 1. Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Publicações (Mês)
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsMes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcance Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.alcanceMes.toLocaleString("pt-BR")}
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
              {stats.interacoesMes.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Tabela CRUD */}
      <GenericCrudTable
        title="Registro de Comunicação"
        items={items || []}
        onSave={saveMarketingItem}
        onDelete={deleteMarketingItem}
        collectionName="marketing_items"
        columns={[
          { key: "data_publicacao", label: "Data" },
          { key: "titulo", label: "Título" },
          { key: "plataforma", label: "Plataforma" },
          { key: "alcance", label: "Alcance" },
          { key: "campanha", label: "Campanha" },
        ]}
        formConfig={[
          {
            name: "titulo",
            label: "Título / Manchete",
            type: "text",
            required: true,
            placeholder: "Ex: Post sobre Outubro Rosa",
          },
          {
            name: "data_publicacao",
            label: "Data da Publicação",
            type: "date",
            required: true,
          },
          {
            name: "plataforma",
            label: "Plataforma / Mídia",
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
            label: "Link da Publicação",
            type: "text", // Idealmente 'url', mas 'text' serve
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
            label: "Interações (Likes/Comentários)",
            type: "number",
            required: false,
            placeholder: "0",
          },
          {
            name: "campanha",
            label: "Campanha / Tema",
            type: "text",
            required: false,
            placeholder: "Ex: Institucional",
          },
        ]}
      />
    </div>
  );
}
