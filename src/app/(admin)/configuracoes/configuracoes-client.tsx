"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericCrudTable } from "./generic-crud-table";
import type { ConfigCollection } from "./actions";

interface ConfiguracoesClientProps {
  origens: any[];
  prioridades: any[];
  tiposEvento: any[];
  tiposAgressao: any[];
  periculosidade: any[];
  locais: any[];
}

export function ConfiguracoesClient({
  origens,
  prioridades,
  tiposEvento,
  tiposAgressao,
  periculosidade,
  locais,
}: ConfiguracoesClientProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as tabelas auxiliares do sistema
        </p>
      </div>

      <Tabs defaultValue="origens" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="origens">Origens</TabsTrigger>
          <TabsTrigger value="prioridades">Prioridades</TabsTrigger>
          <TabsTrigger value="tipos-evento">Tipos de Evento</TabsTrigger>
          <TabsTrigger value="tipos-agressao">Tipos de Agressão</TabsTrigger>
          <TabsTrigger value="periculosidade">Periculosidade</TabsTrigger>
          <TabsTrigger value="locais">Locais</TabsTrigger>
        </TabsList>

        <TabsContent value="origens" className="mt-6">
          <GenericCrudTable
            collectionName="config_origens"
            title="Origens"
            items={origens}
            columns={[
              { key: "nome", label: "Nome" },
              {
                key: "ativo",
                label: "Status",
                render: (item) => (
                  <span
                    className={
                      item.ativo
                        ? "text-green-600 font-medium"
                        : "text-gray-400"
                    }
                  >
                    {item.ativo ? "Ativo" : "Inativo"}
                  </span>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="prioridades" className="mt-6">
          <GenericCrudTable
            collectionName="config_prioridades"
            title="Prioridades"
            items={prioridades}
            columns={[
              { key: "nome", label: "Nome" },
              {
                key: "cor",
                label: "Cor",
                render: (item) => (
                  <div className="flex items-center gap-2">
                    {item.cor && (
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: item.cor }}
                      />
                    )}
                    <span>{item.cor || "-"}</span>
                  </div>
                ),
              },
              { key: "nivel", label: "Nível" },
            ]}
            hasColorField={true}
          />
        </TabsContent>

        <TabsContent value="tipos-evento" className="mt-6">
          <GenericCrudTable
            collectionName="config_tipos_evento"
            title="Tipos de Evento"
            items={tiposEvento}
            columns={[
              { key: "nome", label: "Nome" },
              { key: "icone", label: "Ícone" },
            ]}
          />
        </TabsContent>

        <TabsContent value="tipos-agressao" className="mt-6">
          <GenericCrudTable
            collectionName="config_tipos_agressao"
            title="Tipos de Agressão"
            items={tiposAgressao}
            columns={[{ key: "nome", label: "Nome" }]}
          />
        </TabsContent>

        <TabsContent value="periculosidade" className="mt-6">
          <GenericCrudTable
            collectionName="config_niveis_periculosidade"
            title="Periculosidade"
            items={periculosidade}
            columns={[
              { key: "nome", label: "Nome" },
              {
                key: "cor",
                label: "Cor",
                render: (item) => (
                  <div className="flex items-center gap-2">
                    {item.cor && (
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: item.cor }}
                      />
                    )}
                    <span>{item.cor || "-"}</span>
                  </div>
                ),
              },
              { key: "peso", label: "Peso" },
            ]}
            hasColorField={true}
          />
        </TabsContent>

        <TabsContent value="locais" className="mt-6">
          <GenericCrudTable
            collectionName="locais"
            title="Locais"
            items={locais}
            columns={[{ key: "nome", label: "Nome" }]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
