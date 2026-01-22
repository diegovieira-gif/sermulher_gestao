"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericCrudTable } from "@/components/shared/generic-crud-table";
import { saveAuxItem, deleteAuxItem } from "./actions";
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
import { z } from "zod";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
}: ConfiguracoesClientProps) {
  const monthOptions = [
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
  ];

  return (
    <div>
      <Tabs defaultValue="origens" className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 shrink-0">
          <TabsList className="flex md:flex-col h-auto bg-transparent p-0 gap-1 overflow-x-auto md:overflow-visible w-full flex-nowrap md:flex-wrap">
            <TabsTrigger
              value="origens"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Building2 className="w-4 h-4" />
              <span>Origens</span>
            </TabsTrigger>
            <TabsTrigger
              value="prioridades"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Prioridades</span>
            </TabsTrigger>
            <TabsTrigger
              value="tipos-evento"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Tipos de Evento</span>
            </TabsTrigger>
            <TabsTrigger
              value="tipos-violencia"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Tipos de Violência</span>
            </TabsTrigger>
            <TabsTrigger
              value="encaminhamentos"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Encaminhamentos</span>
            </TabsTrigger>
            <TabsTrigger
              value="periculosidade"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Siren className="w-4 h-4" />
              <span>Periculosidade</span>
            </TabsTrigger>
            <TabsTrigger
              value="status-legal"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Scale className="w-4 h-4" />
              <span>Status Legal</span>
            </TabsTrigger>
            <TabsTrigger
              value="locais"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <MapPin className="w-4 h-4" />
              <span>Locais</span>
            </TabsTrigger>
            <TabsTrigger
              value="bairros"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Map className="w-4 h-4" />
              <span>Bairros</span>
            </TabsTrigger>
            <TabsTrigger
              value="beneficios"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Benefícios</span>
            </TabsTrigger>
            <TabsTrigger
              value="campanhas"
              className="flex items-center gap-2 justify-start w-full md:w-full px-4 py-3 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Megaphone className="w-4 h-4" />
              <span>Campanhas</span>
            </TabsTrigger>
          </TabsList>
        </aside>

        <div className="flex-1 min-w-0">
          <TabsContent value="origens" className="mt-0 md:mt-0">
            <GenericCrudTable
              title="Origens de Encaminhamento"
              items={origens}
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(values, ctx) => saveAuxItem("origens", values)}
              onDelete={(id) => deleteAuxItem("origens", id)}
            />
          </TabsContent>

          <TabsContent value="prioridades" className="mt-0 md:mt-0">
            <GenericCrudTable
              title="Níveis de Prioridade"
              items={prioridades}
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(values, ctx) => saveAuxItem("prioridades", values)}
              onDelete={(id) => deleteAuxItem("prioridades", id)}
            />
          </TabsContent>

          <TabsContent value="tipos-evento" className="mt-0 md:mt-0">
            <GenericCrudTable
              title="Tipos de Evento"
              items={tiposEvento}
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(values, ctx) => saveAuxItem("tipos-evento", values)}
              onDelete={(id) => deleteAuxItem("tipos-evento", id)}
            />
          </TabsContent>

          <TabsContent value="tipos-violencia" className="mt-0 md:mt-0">
            <GenericCrudTable
              title="Tipos de Violência"
              items={tiposAgressao}
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(values, ctx) => saveAuxItem("tipos-violencia", values)}
              onDelete={(id) => deleteAuxItem("tipos-violencia", id)}
            />
          </TabsContent>

          <TabsContent value="encaminhamentos" className="mt-0 md:mt-0">
            <GenericCrudTable
              title="Encaminhamentos (RMA)"
              items={encaminhamentos}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "grupo_rma", label: "Grupo RMA" },
              ]}
              hasGrupoRma={true}
              onSave={(values, ctx) => saveAuxItem("encaminhamentos", values)}
              onDelete={(id) => deleteAuxItem("encaminhamentos", id)}
            />
          </TabsContent>

          <TabsContent value="periculosidade" className="mt-0 md:mt-0">
            <GenericCrudTable
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
              onSave={(values, ctx) => saveAuxItem("periculosidade", values)}
              onDelete={(id) => deleteAuxItem("periculosidade", id)}
            />
          </TabsContent>

          <TabsContent value="status-legal" className="mt-0 md:mt-0">
            <GenericCrudTable
              title="Status Legal"
              items={statusLegal}
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
              ]}
              hasColorField={true}
              onSave={(values, ctx) => saveAuxItem("status-legal", values)}
              onDelete={(id) => deleteAuxItem("status-legal", id)}
            />
          </TabsContent>

          <TabsContent value="locais" className="mt-0 md:mt-0">
            <GenericCrudTable
              title="Locais (Salas)"
              items={locais}
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(values, ctx) => saveAuxItem("locais", values)}
              onDelete={(id) => deleteAuxItem("locais", id)}
            />
          </TabsContent>

          <TabsContent value="bairros" className="mt-0 md:mt-0">
            <GenericCrudTable
              title="Bairros"
              items={bairros}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "zona", label: "Zona" },
              ]}
              onSave={(values, ctx) => saveAuxItem("bairros", values)}
              onDelete={(id) => deleteAuxItem("bairros", id)}
            />
          </TabsContent>

          <TabsContent value="beneficios" className="mt-0 md:mt-0">
            <GenericCrudTable
              title="Benefícios"
              items={beneficios}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "descricao", label: "Descrição" },
              ]}
              onSave={(values, ctx) => saveAuxItem("beneficios", values)}
              onDelete={(id) => deleteAuxItem("beneficios", id)}
            />
          </TabsContent>

          <TabsContent value="campanhas" className="mt-0 md:mt-0">
            <GenericCrudTable
              title="Campanhas"
              items={campanhas}
              columns={[
                { key: "nome", label: "Nome" },
                { key: "mes", label: "Mês" },
                {
                  key: "cor",
                  label: "Cor",
                  render: (item) => (
                    <div className="flex items-center gap-2">
                      {item.cor && (
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: item.cor }}
                        />
                      )}
                      <span>{item.cor || "-"}</span>
                    </div>
                  ),
                },
              ]}
              hasColorField={true}
              defaultValues={{
                nome: "",
                mes: "",
                cor: "#000000",
                status: "published",
              }}
              formSchema={z.object({
                id: z.number().optional(),
                nome: z
                  .string()
                  .min(2, "Nome deve ter pelo menos 2 caracteres"),
                mes: z.string().min(1, "Selecione o mês"),
                cor: z.string().min(1, "Selecione a cor"),
                status: z.string().min(1, "Selecione o status"),
              })}
              mapItemToFormValues={(item) => ({
                id: item.id,
                nome: item.nome,
                mes: item.mes || "",
                cor: item.cor || "#000000",
                status: item.status || "published",
              })}
              onSave={(values, ctx) => saveAuxItem("campanhas", values)}
              onDelete={(id) => deleteAuxItem("campanhas", id)}
              renderFormFields={(form: any) => (
                <>
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nome
                          <InfoTooltip text="Nome identificador da campanha temática." />
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Campanha Outubro Rosa"
                            {...field}
                          />
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
                        <FormLabel>
                          Mês
                          <InfoTooltip text="Mês de referência da campanha para organização e relatórios." />
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                            <SelectContent>
                              {monthOptions.map((mes) => (
                                <SelectItem key={mes} value={mes}>
                                  {mes}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <FormLabel>
                          Cor
                          <InfoTooltip text="Cor hexadecimal para identificação visual da campanha em gráficos e relatórios." />
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="color"
                              className="w-12 h-10 p-1"
                              {...field}
                            />
                          </FormControl>
                          <Input
                            placeholder="#000000"
                            {...field}
                            className="flex-1"
                          />
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
                        <FormLabel>
                          Status
                          <InfoTooltip text="Define se a campanha está ativa, inativa ou arquivada no sistema." />
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="published">Ativo</SelectItem>
                              <SelectItem value="draft">
                                Inativo (Rascunho)
                              </SelectItem>
                              <SelectItem value="archived">
                                Arquivado
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
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
