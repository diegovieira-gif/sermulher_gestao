"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericCrudTable } from "@/components/shared/generic-crud-table";
import { saveAuxItem, deleteAuxItem } from "./actions";
import { z } from "zod";
import {
  Building2,
  AlertCircle,
  CalendarDays,
  ShieldAlert,
  ArrowUpRight,
  Siren,
  Scale,
  MapPin,
  Map,
  HeartHandshake,
  Megaphone,
  Briefcase,
} from "lucide-react";

interface ConfiguracoesClientProps {
  origens: any[];
  prioridades: any[];
  tiposEvento: any[];
  tiposAgressao: any[];
  encaminhamentos: any[];
  periculosidade: any[];
  statusLegal: any[];
  locais: any[];
  bairros: any[];
  beneficios: any[];
  campanhas: any[];
  setores: any[];
}

// Schema base reutilizável
const baseSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  status: z.string().default("published"),
});

// Schema com cor
const colorSchema = baseSchema.extend({
  cor: z.string().optional(),
});

export function ConfiguracoesClient({
  origens,
  prioridades,
  tiposEvento,
  tiposAgressao,
  encaminhamentos,
  periculosidade,
  statusLegal,
  locais,
  bairros,
  beneficios,
  campanhas,
  setores,
}: ConfiguracoesClientProps) {
  // Função auxiliar para renderizar a bolinha de cor
  const renderColor = (item: any) => (
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-4 rounded-full border shadow-sm"
        style={{ backgroundColor: item.cor || "#000" }}
      />
      <span className="text-xs text-muted-foreground font-mono uppercase">
        {item.cor}
      </span>
    </div>
  );

  return (
    <div className="w-full">
      <Tabs defaultValue="origens" className="w-full space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="h-auto w-max justify-start gap-2 bg-transparent p-0">
            <TabsTrigger
              value="origens"
              className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 border border-transparent data-[state=active]:border-purple-200"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Origens
            </TabsTrigger>
            <TabsTrigger
              value="prioridades"
              className="data-[state=active]:bg-red-100 data-[state=active]:text-red-900 border border-transparent data-[state=active]:border-red-200"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Prioridades
            </TabsTrigger>
            <TabsTrigger
              value="tipos-evento"
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 border border-transparent data-[state=active]:border-blue-200"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Tipos Evento
            </TabsTrigger>
            <TabsTrigger
              value="tipos-agressao"
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900 border border-transparent data-[state=active]:border-orange-200"
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Tipos Agressão
            </TabsTrigger>
            <TabsTrigger
              value="encaminhamentos"
              className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900 border border-transparent data-[state=active]:border-green-200"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Encaminhamentos
            </TabsTrigger>
            <TabsTrigger
              value="periculosidade"
              className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 border border-transparent data-[state=active]:border-slate-200"
            >
              <Siren className="mr-2 h-4 w-4" />
              Níveis Risco
            </TabsTrigger>
            <TabsTrigger
              value="status-legal"
              className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-900 border border-transparent data-[state=active]:border-yellow-200"
            >
              <Scale className="mr-2 h-4 w-4" />
              Status Legal
            </TabsTrigger>
            <TabsTrigger
              value="locais"
              className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-900 border border-transparent data-[state=active]:border-indigo-200"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Locais (Sala Azul)
            </TabsTrigger>
            <TabsTrigger
              value="bairros"
              className="data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-900 border border-transparent data-[state=active]:border-cyan-200"
            >
              <Map className="mr-2 h-4 w-4" />
              Bairros
            </TabsTrigger>
            <TabsTrigger
              value="beneficios"
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 border border-transparent data-[state=active]:border-emerald-200"
            >
              <HeartHandshake className="mr-2 h-4 w-4" />
              Benefícios
            </TabsTrigger>
            <TabsTrigger
              value="campanhas"
              className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-900 border border-transparent data-[state=active]:border-pink-200"
            >
              <Megaphone className="mr-2 h-4 w-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger
              value="setores"
              className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 border border-transparent data-[state=active]:border-gray-200"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Setores
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-4">
          {/* 1. Origens */}
          <TabsContent value="origens" className="space-y-4 focus:outline-none">
            <GenericCrudTable
              title="Origens da Demanda"
              description="Fontes de onde chegam as mulheres (ex: CRAS, CREAS, Espontânea)."
              data={origens}
              hasColorField={true}
              showStatus={true}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "cor", label: "Cor", render: renderColor },
              ]}
              schema={colorSchema}
              onSave={(data) => saveAuxItem("config_origens", data)}
              onDelete={(id) => deleteAuxItem("config_origens", id)}
            />
          </TabsContent>

          {/* 2. Prioridades */}
          <TabsContent
            value="prioridades"
            className="space-y-4 focus:outline-none"
          >
            <GenericCrudTable
              title="Níveis de Prioridade"
              description="Classificação de urgência para atendimentos (ex: Alta, Média, Baixa)."
              data={prioridades}
              hasColorField={true}
              showStatus={true}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "cor", label: "Cor", render: renderColor },
              ]}
              schema={colorSchema}
              onSave={(data) => saveAuxItem("config_prioridades", data)}
              onDelete={(id) => deleteAuxItem("config_prioridades", id)}
            />
          </TabsContent>

          {/* 3. Tipos de Evento */}
          <TabsContent
            value="tipos-evento"
            className="space-y-4 focus:outline-none"
          >
            <GenericCrudTable
              title="Tipos de Evento"
              description="Categorias para a agenda institucional (ex: Reunião, Palestra, Ação Externa)."
              data={tiposEvento}
              showStatus={true}
              columns={[{ key: "nome", label: "Nome" }]}
              schema={baseSchema}
              onSave={(data) => saveAuxItem("config_tipos_evento", data)}
              onDelete={(id) => deleteAuxItem("config_tipos_evento", id)}
            />
          </TabsContent>

          {/* 4. Tipos de Agressão */}
          <TabsContent
            value="tipos-agressao"
            className="space-y-4 focus:outline-none"
          >
            <GenericCrudTable
              title="Tipos de Violência/Agressão"
              description="Tipificações de violência para relatórios (ex: Física, Psicológica, Patrimonial)."
              data={tiposAgressao}
              showStatus={true}
              columns={[{ key: "nome", label: "Nome" }]}
              schema={baseSchema}
              onSave={(data) => saveAuxItem("config_tipos_agressao", data)}
              onDelete={(id) => deleteAuxItem("config_tipos_agressao", id)}
            />
          </TabsContent>

          {/* 5. Encaminhamentos */}
          <TabsContent
            value="encaminhamentos"
            className="space-y-4 focus:outline-none"
          >
            <GenericCrudTable
              title="Encaminhamentos"
              description="Destinos para onde as usuárias são encaminhadas."
              data={encaminhamentos}
              showStatus={true}
              hasGrupoRma={true}
              columns={[
                { key: "nome", label: "Nome" },
                {
                  key: "grupo_rma",
                  label: "Grupo RMA",
                  render: (item) => (
                    <span className="capitalize px-2 py-1 bg-slate-100 rounded text-xs">
                      {item.grupo_rma?.replace("_", " ") || "-"}
                    </span>
                  ),
                },
              ]}
              schema={baseSchema.extend({
                grupo_rma: z.string().min(1, "Grupo é obrigatório"),
              })}
              onSave={(data) => saveAuxItem("config_encaminhamentos", data)}
              onDelete={(id) => deleteAuxItem("config_encaminhamentos", id)}
            />
          </TabsContent>

          {/* 6. Periculosidade */}
          <TabsContent
            value="periculosidade"
            className="space-y-4 focus:outline-none"
          >
            <GenericCrudTable
              title="Níveis de Periculosidade"
              description="Classificação de risco do agressor na Sala Azul."
              data={periculosidade}
              showStatus={true}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "peso", label: "Peso" },
              ]}
              schema={baseSchema.extend({
                peso: z.coerce.number().optional(),
              })}
              onSave={(data) =>
                saveAuxItem("config_niveis_periculosidade", data)
              }
              onDelete={(id) =>
                deleteAuxItem("config_niveis_periculosidade", id)
              }
            />
          </TabsContent>

          {/* 7. Status Legal */}
          <TabsContent
            value="status-legal"
            className="space-y-4 focus:outline-none"
          >
            <GenericCrudTable
              title="Status Legal"
              description="Situação jurídica do processo (ex: Medida Deferida, Aguardando Audiência)."
              data={statusLegal}
              showStatus={true}
              columns={[{ key: "nome", label: "Nome" }]}
              schema={baseSchema}
              onSave={(data) => saveAuxItem("config_status_legal", data)}
              onDelete={(id) => deleteAuxItem("config_status_legal", id)}
            />
          </TabsContent>

          {/* 8. Locais */}
          <TabsContent value="locais" className="space-y-4 focus:outline-none">
            <GenericCrudTable
              title="Locais de Realização"
              description="Locais onde ocorrem os grupos reflexivos da Sala Azul."
              data={locais}
              showStatus={true}
              columns={[{ key: "nome", label: "Nome" }]}
              schema={baseSchema}
              onSave={(data) => saveAuxItem("locais", data)}
              onDelete={(id) => deleteAuxItem("locais", id)}
            />
          </TabsContent>

          {/* 9. Bairros */}
          <TabsContent value="bairros" className="space-y-4 focus:outline-none">
            <GenericCrudTable
              title="Bairros de Aracaju"
              description="Lista de bairros para padronização de endereços."
              data={bairros}
              showStatus={true}
              columns={[{ key: "nome", label: "Nome" }]}
              schema={baseSchema}
              onSave={(data) => saveAuxItem("config_bairros", data)}
              onDelete={(id) => deleteAuxItem("config_bairros", id)}
            />
          </TabsContent>

          {/* 10. Benefícios */}
          <TabsContent
            value="beneficios"
            className="space-y-4 focus:outline-none"
          >
            <GenericCrudTable
              title="Benefícios Eventuais"
              description="Tipos de auxílios entregues (ex: Cesta Básica, Kit Higiene)."
              data={beneficios}
              showStatus={true}
              columns={[{ key: "nome", label: "Nome" }]}
              schema={baseSchema}
              onSave={(data) => saveAuxItem("config_beneficios", data)}
              onDelete={(id) => deleteAuxItem("config_beneficios", id)}
            />
          </TabsContent>

          {/* 11. Campanhas */}
          <TabsContent
            value="campanhas"
            className="space-y-4 focus:outline-none"
          >
            <GenericCrudTable
              title="Campanhas"
              description="Temas e campanhas (ex: Agosto Lilás, Outubro Rosa)."
              data={campanhas}
              showStatus={true}
              columns={[{ key: "nome", label: "Nome" }]}
              schema={baseSchema}
              onSave={(data) => saveAuxItem("config_campanhas", data)}
              onDelete={(id) => deleteAuxItem("config_campanhas", id)}
            />
          </TabsContent>

          {/* 12. Setores */}
          <TabsContent value="setores" className="space-y-4 focus:outline-none">
            <GenericCrudTable
              title="Setores"
              description="Setores internos para tramitação de demandas."
              data={setores}
              showStatus={true}
              columns={[{ key: "nome", label: "Nome" }]}
              schema={baseSchema}
              onSave={(data) => saveAuxItem("setores", data)}
              onDelete={(id) => deleteAuxItem("setores", id)}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
