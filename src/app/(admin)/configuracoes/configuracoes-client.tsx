"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericCrudTable } from "./generic-crud-table";

interface ConfiguracoesClientProps {
  origens: any[];
  prioridades: any[];
  tiposEvento: any[];
  tiposAgressao: any[];
  encaminhamentos: any[];
  periculosidade: any[];
  locais: any[];
  bairros: any[];
  beneficios: any[];
}

export function ConfiguracoesClient({
  origens,
  prioridades,
  tiposEvento,
  tiposAgressao,
  encaminhamentos,
  periculosidade,
  locais,
  bairros,
  beneficios,
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
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="origens">Origens</TabsTrigger>
          <TabsTrigger value="prioridades">Prioridades</TabsTrigger>
          <TabsTrigger value="tipos-evento">Tipos de Evento</TabsTrigger>
          <TabsTrigger value="tipos-violencia">Tipos de Violência</TabsTrigger>
          <TabsTrigger value="encaminhamentos">Encaminhamentos</TabsTrigger>
          <TabsTrigger value="periculosidade">Periculosidade</TabsTrigger>
          <TabsTrigger value="locais">Locais</TabsTrigger>
          <TabsTrigger value="bairros">Bairros</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
        </TabsList>

        <TabsContent value="origens" className="mt-6">
          <GenericCrudTable
            collectionName="config_origens"
            title="Origens de Encaminhamento"
            items={origens}
            // REMOVIDO: { key: "status", label: "Status" } -> O componente já gera automático
            columns={[{ key: "nome", label: "Nome" }]}
          />
        </TabsContent>

        <TabsContent value="prioridades" className="mt-6">
          <GenericCrudTable
            collectionName="config_prioridades"
            title="Níveis de Prioridade"
            items={prioridades}
            columns={[{ key: "nome", label: "Nome" }]}
          />
        </TabsContent>

        <TabsContent value="tipos-evento" className="mt-6">
          <GenericCrudTable
            collectionName="config_tipos_evento"
            title="Tipos de Evento"
            items={tiposEvento}
            columns={[{ key: "nome", label: "Nome" }]}
          />
        </TabsContent>

        <TabsContent value="tipos-violencia" className="mt-6">
          <GenericCrudTable
            collectionName="config_tipos_agressao"
            title="Tipos de Violência"
            items={tiposAgressao}
            columns={[{ key: "nome", label: "Nome" }]}
          />
        </TabsContent>

        <TabsContent value="encaminhamentos" className="mt-6">
          <GenericCrudTable
            collectionName="config_encaminhamentos"
            title="Encaminhamentos (RMA)"
            items={encaminhamentos}
            columns={[
              { key: "nome", label: "Nome" },
              { key: "grupo_rma", label: "Grupo RMA" },
            ]}
          />
        </TabsContent>

        <TabsContent value="periculosidade" className="mt-6">
          <GenericCrudTable
            collectionName="config_niveis_periculosidade"
            title="Níveis de Periculosidade"
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
            title="Locais (Salas)"
            items={locais}
            columns={[{ key: "nome", label: "Nome" }]}
          />
        </TabsContent>

        <TabsContent value="bairros" className="mt-6">
          <GenericCrudTable
            collectionName="config_bairros"
            title="Bairros"
            items={bairros}
            columns={[
              { key: "nome", label: "Nome" },
              { key: "zona", label: "Zona" },
            ]}
          />
        </TabsContent>

        <TabsContent value="beneficios" className="mt-6">
          <GenericCrudTable
            collectionName="config_beneficios"
            title="Benefícios"
            items={beneficios}
            columns={[
              { key: "nome", label: "Nome" },
              { key: "descricao", label: "Descrição" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}