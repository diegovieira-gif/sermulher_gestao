"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericCrudTable } from "@/components/shared/generic-crud-table";
import { saveAuxItem, deleteAuxItem } from "./actions";
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
  Users,
  MapPinned,
  Key,
} from "lucide-react";

// Imports dos Componentes Refatorados
import { TabEncaminhamentos } from "./tabs/tab-encaminhamentos";
import { TabPadrao } from "./tabs/tab-padrao";

// Imports de UI necessários para os casos inline (Campanhas/Periculosidade)
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { campanhaSchema, periculosidadeSchema, integracaoSchema } from "./schemas";

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
  racaCor: any[];
  estadoCivil: any[];
  escolaridade: any[];
  situacaoTrabalho: any[];
  integracoes: any[];
}

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
  racaCor,
  estadoCivil,
  escolaridade,
  situacaoTrabalho,
  integracoes,
}: ConfiguracoesClientProps) {
  const menuItems = [
    { label: "Estrutural", isHeader: true },
    { value: "integracoes", label: "Integrações", icon: Key },
    { value: "setores", label: "Setores", icon: Briefcase },
    { value: "locais", label: "Locais", icon: Building2 },
    { value: "bairros", label: "Endereços", icon: MapPinned },

    { label: "Demografia", isHeader: true },
    { value: "demografia", label: "Dados Demográficos", icon: Users },

    { label: "Atendimento", isHeader: true },
    { value: "origens", label: "Origens", icon: ArrowUpRight },
    { value: "prioridades", label: "Prioridades", icon: AlertCircle },
    {
      value: "tipos-violencia",
      label: "Tipos de Violência",
      icon: ShieldAlert,
    },
    { value: "encaminhamentos", label: "Encaminhamentos", icon: Map },
    { value: "beneficios", label: "Benefícios", icon: HeartHandshake },

    { label: "Outros", isHeader: true },
    { value: "tipos-evento", label: "Tipos de Evento", icon: CalendarDays },
    { value: "campanhas", label: "Campanhas", icon: Megaphone },
    { value: "periculosidade", label: "Periculosidade", icon: Siren },
    { value: "status-legal", label: "Status Legal", icon: Scale },
  ];

  return (
    <div className="w-full">
      <Tabs defaultValue="setores" className="flex flex-col md:flex-row gap-6">
        {/* MENU LATERAL */}
        <aside className="w-full md:w-64 shrink-0">
          <TabsList className="flex md:flex-col h-auto bg-transparent p-0 gap-1 overflow-x-auto md:overflow-visible w-full flex-nowrap md:flex-wrap text-left">
            {menuItems.map((item, idx) =>
              item.isHeader ? (
                <div
                  key={idx}
                  className="hidden md:block px-4 py-2 mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {item.label}
                </div>
              ) : (
                <TabsTrigger
                  key={item.value}
                  value={item.value!}
                  className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </TabsTrigger>
              ),
            )}
          </TabsList>
        </aside>

        {/* CONTEÚDO */}
        <div className="flex-1 bg-card rounded-lg border shadow-sm p-6 min-h-[500px]">
          {/* --- CRUDS PADRONIZADOS --- */}
          <TabsContent value="integracoes" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Chaves de API e Integrações"
              items={integracoes}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "status", label: "Status" },
              ]}
              onSave={(data) => saveAuxItem("config_integracao", data)}
              onDelete={(id) => deleteAuxItem("config_integracao", id)}
              formSchema={integracaoSchema}
              renderFormFields={(form: any) => (
                <>
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Integração (ex: Gemini)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gemini_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="published">Ativo</SelectItem>
                            <SelectItem value="draft">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            />
          </TabsContent>

          <TabsContent value="setores" className="mt-0 space-y-4">
            <TabPadrao
              title="Setores"
              data={setores}
              collectionName="setores"
              type="setores"
            />
          </TabsContent>

          <TabsContent value="locais" className="mt-0 space-y-4">
            <TabPadrao
              title="Locais de Atendimento"
              data={locais}
              collectionName="locais"
              type="locais"
            />
          </TabsContent>

          <TabsContent value="bairros" className="mt-0 space-y-4">
            <TabPadrao
              title="Bairros do Município"
              data={bairros}
              collectionName="config_bairros"
              type="bairros"
            />
          </TabsContent>

          <TabsContent value="demografia" className="mt-0 space-y-8">
            <div className="grid gap-8">
              <TabPadrao
                title="Raça / Cor"
                data={racaCor}
                collectionName="config_raca_cor"
                type="raca-cor"
              />
              <TabPadrao
                title="Estado Civil"
                data={estadoCivil}
                collectionName="config_estado_civil"
                type="estado-civil"
              />
              <TabPadrao
                title="Escolaridade"
                data={escolaridade}
                collectionName="config_escolaridade"
                type="escolaridade"
              />
              <TabPadrao
                title="Situação de Trabalho"
                data={situacaoTrabalho}
                collectionName="config_situacao_trabalho"
                type="situacao-trabalho"
              />
            </div>
          </TabsContent>

          <TabsContent value="origens" className="mt-0 space-y-4">
            <TabPadrao
              title="Origens"
              data={origens}
              collectionName="config_origens"
              type="origens"
              hasColor
            />
          </TabsContent>

          <TabsContent value="prioridades" className="mt-0 space-y-4">
            <TabPadrao
              title="Prioridades"
              data={prioridades}
              collectionName="config_prioridades"
              type="prioridades"
              hasColor
            />
          </TabsContent>

          <TabsContent value="tipos-violencia" className="mt-0 space-y-4">
            <TabPadrao
              title="Tipos de Violência"
              data={tiposAgressao}
              collectionName="config_tipos_agressao"
              type="tipos-violencia"
            />
          </TabsContent>

          <TabsContent value="beneficios" className="mt-0 space-y-4">
            <TabPadrao
              title="Benefícios"
              data={beneficios}
              collectionName="config_beneficios"
              type="beneficios"
            />
          </TabsContent>

          <TabsContent value="tipos-evento" className="mt-0 space-y-4">
            <TabPadrao
              title="Tipos de Evento"
              data={tiposEvento}
              collectionName="config_tipos_evento"
              type="tipos-evento"
            />
          </TabsContent>

          <TabsContent value="status-legal" className="mt-0 space-y-4">
            <TabPadrao
              title="Status Legal"
              data={statusLegal}
              collectionName="config_status_legal"
              type="status-legal"
              hasColor
            />
          </TabsContent>

          {/* --- CRUDS ESPECÍFICOS --- */}

          {/* ENCAMINHAMENTOS (Corrigido) */}
          <TabsContent value="encaminhamentos" className="mt-0 space-y-4">
            <TabEncaminhamentos data={encaminhamentos} />
          </TabsContent>

          {/* CAMPANHAS (Inline por enquanto) */}
          <TabsContent value="campanhas" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Campanhas de Marketing"
              items={campanhas}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "mes", label: "Mês" },
                { key: "status", label: "Status" },
              ]}
              onSave={(data) => saveAuxItem("config_campanhas", data)}
              onDelete={(id) => deleteAuxItem("config_campanhas", id)}
              formSchema={campanhaSchema}
              renderFormFields={(form: any) => (
                <>
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              "Janeiro",
                              "Fevereiro",
                              "Março",
                              "Abril",
                              "Maio",
                              "Junho",
                              "Julho",
                              "Agosto",
                              "Setembro",
                              "Outubro",
                              "Novembro",
                              "Dezembro",
                            ].map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <div className="flex gap-2">
                          <Input type="color" className="w-12 p-1" {...field} />
                          <Input {...field} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="published">Ativo</SelectItem>
                            <SelectItem value="draft">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            />
          </TabsContent>

          {/* PERICULOSIDADE (Inline por enquanto) */}
          <TabsContent value="periculosidade" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Níveis de Periculosidade"
              items={periculosidade}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "peso", label: "Peso" },
              ]}
              onSave={(data) =>
                saveAuxItem("config_niveis_periculosidade", data)
              }
              onDelete={(id) =>
                deleteAuxItem("config_niveis_periculosidade", id)
              }
              formSchema={periculosidadeSchema}
              renderFormFields={(form: any) => (
                <>
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="peso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <div className="flex gap-2">
                          <Input type="color" className="w-12 p-1" {...field} />
                          <Input {...field} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="published">Ativo</SelectItem>
                            <SelectItem value="draft">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
