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
  // Schema padrão
  const basicSchema = z.object({
    nome: z.string().min(2, "Nome é obrigatório"),
  });

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
    <div className="w-full">
      <Tabs defaultValue="setores" className="flex flex-col md:flex-row gap-6">
        {/* MENU LATERAL */}
        <aside className="w-full md:w-64 shrink-0">
          <TabsList className="flex md:flex-col h-auto bg-transparent p-0 gap-1 overflow-x-auto md:overflow-visible w-full flex-nowrap md:flex-wrap text-left">
            <div className="hidden md:block px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Estrutural
            </div>

            <TabsTrigger
              value="setores"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Briefcase className="w-4 h-4" />
              <span>Setores</span>
            </TabsTrigger>

            <TabsTrigger
              value="locais"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Building2 className="w-4 h-4" />
              <span>Locais</span>
            </TabsTrigger>

            <TabsTrigger
              value="bairros"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <MapPin className="w-4 h-4" />
              <span>Bairros</span>
            </TabsTrigger>

            <div className="hidden md:block px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Atendimento
            </div>

            <TabsTrigger
              value="origens"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Origens</span>
            </TabsTrigger>

            <TabsTrigger
              value="prioridades"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Prioridades</span>
            </TabsTrigger>

            <TabsTrigger
              value="tipos-violencia"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Tipos de Violência</span>
            </TabsTrigger>

            <TabsTrigger
              value="encaminhamentos"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Map className="w-4 h-4" />
              <span>Encaminhamentos</span>
            </TabsTrigger>

            <TabsTrigger
              value="beneficios"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Benefícios</span>
            </TabsTrigger>

            <div className="hidden md:block px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Outros
            </div>

            <TabsTrigger
              value="tipos-evento"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Tipos de Evento</span>
            </TabsTrigger>

            <TabsTrigger
              value="campanhas"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Megaphone className="w-4 h-4" />
              <span>Campanhas</span>
            </TabsTrigger>

            <TabsTrigger
              value="periculosidade"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Siren className="w-4 h-4" />
              <span>Periculosidade</span>
            </TabsTrigger>
            <TabsTrigger
              value="status-legal"
              className="flex items-center gap-2 justify-start w-full px-4 py-3 data-[state=active]:bg-muted data-[state=active]:border-l-4 data-[state=active]:border-primary data-[state=active]:font-semibold"
            >
              <Scale className="w-4 h-4" />
              <span>Status Legal</span>
            </TabsTrigger>
          </TabsList>
        </aside>

        {/* CONTEÚDO */}
        <div className="flex-1 bg-card rounded-lg border shadow-sm p-6 min-h-[500px]">
          {/* SETORES */}
          <TabsContent value="setores" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Setores"
              description="Gerencie os setores (departamentos) da instituição. Ex: Recepção, Jurídico."
              items={setores}
              type="setores"
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(data) => saveAuxItem("setores", data)}
              onDelete={(id) => deleteAuxItem("setores", id)}
              // Mantém manual pois setores não requer status/cor
              formSchema={basicSchema}
              renderFormFields={(form) => (
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Setor</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Recepção" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            />
          </TabsContent>

          {/* LOCAIS */}
          <TabsContent value="locais" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Locais de Atendimento"
              items={locais}
              type="locais"
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(data) => saveAuxItem("locais", data)}
              onDelete={(id) => deleteAuxItem("locais", id)}
              formSchema={basicSchema}
              renderFormFields={(form) => (
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sala de Reunião 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            />
          </TabsContent>

          {/* BAIRROS */}
          <TabsContent value="bairros" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Bairros"
              items={bairros}
              type="bairros"
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(data) => saveAuxItem("bairros", data)}
              onDelete={(id) => deleteAuxItem("bairros", id)}
              formSchema={basicSchema}
              renderFormFields={(form) => (
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            />
          </TabsContent>

          {/* ORIGENS */}
          <TabsContent value="origens" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Origens"
              items={origens}
              type="origens"
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(v) => saveAuxItem("origens", v)}
              onDelete={(id) => deleteAuxItem("origens", id)}
              formSchema={basicSchema}
              renderFormFields={(form) => (
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            />
          </TabsContent>

          {/* PRIORIDADES */}
          <TabsContent value="prioridades" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Prioridades"
              items={prioridades}
              type="prioridades"
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(v) => saveAuxItem("prioridades", v)}
              onDelete={(id) => deleteAuxItem("prioridades", id)}
              formSchema={basicSchema}
              renderFormFields={(form) => (
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            />
          </TabsContent>

          {/* TIPOS VIOLÊNCIA */}
          <TabsContent value="tipos-violencia" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Tipos de Violência"
              items={tiposAgressao}
              type="tipos-violencia"
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(v) => saveAuxItem("tipos-violencia", v)}
              onDelete={(id) => deleteAuxItem("tipos-violencia", id)}
              formSchema={basicSchema}
              renderFormFields={(form) => (
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            />
          </TabsContent>

          {/* ENCAMINHAMENTOS - CORRIGIDO */}
          <TabsContent value="encaminhamentos" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Encaminhamentos"
              items={encaminhamentos}
              type="encaminhamentos"
              hasGrupoRma={true} // Ativa o campo obrigatório
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
              onSave={(v) => saveAuxItem("encaminhamentos", v)}
              onDelete={(id) => deleteAuxItem("encaminhamentos", id)}
              // Removido schema manual para usar o padrão que inclui grupo_rma
            />
          </TabsContent>

          {/* BENEFICIOS */}
          <TabsContent value="beneficios" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Benefícios"
              items={beneficios}
              type="beneficios"
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(v) => saveAuxItem("beneficios", v)}
              onDelete={(id) => deleteAuxItem("beneficios", id)}
              formSchema={basicSchema}
              renderFormFields={(form) => (
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            />
          </TabsContent>

          {/* TIPOS EVENTO */}
          <TabsContent value="tipos-evento" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Tipos de Evento"
              items={tiposEvento}
              type="tipos-evento"
              columns={[{ key: "nome", label: "Nome" }]}
              onSave={(v) => saveAuxItem("tipos-evento", v)}
              onDelete={(id) => deleteAuxItem("tipos-evento", id)}
              formSchema={basicSchema}
              renderFormFields={(form) => (
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            />
          </TabsContent>

          {/* PERICULOSIDADE */}
          <TabsContent value="periculosidade" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Níveis de Periculosidade"
              items={periculosidade}
              type="periculosidade"
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
              onSave={(v) => saveAuxItem("periculosidade", v)}
              onDelete={(id) => deleteAuxItem("periculosidade", id)}
              formSchema={z.object({
                nome: z.string().min(2, "Nome obrigatório"),
                cor: z.string().optional(),
                peso: z.coerce.number().optional(),
              })}
              renderFormFields={(form) => (
                <>
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input type="color" className="w-12" {...field} />
                          <Input {...field} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="peso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (Gravidade)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            />
          </TabsContent>

          {/* STATUS LEGAL */}
          <TabsContent value="status-legal" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Status Legal"
              items={statusLegal}
              type="status-legal"
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
              onSave={(v) => saveAuxItem("status-legal", v)}
              onDelete={(id) => deleteAuxItem("status-legal", id)}
              formSchema={z.object({
                nome: z.string().min(2, "Nome obrigatório"),
                cor: z.string().optional(),
              })}
              renderFormFields={(form) => (
                <>
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input type="color" className="w-12" {...field} />
                          <Input {...field} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            />
          </TabsContent>

          {/* CAMPANHAS */}
          <TabsContent value="campanhas" className="mt-0 space-y-4">
            <GenericCrudTable
              title="Campanhas de Marketing"
              items={campanhas}
              type="campanhas"
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
                {
                  key: "status",
                  label: "Status",
                  render: (item) => (
                    <span
                      className={`px-2 py-1 rounded text-xs ${item.status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {item.status === "published" ? "Ativo" : "Inativo"}
                    </span>
                  ),
                },
              ]}
              hasColorField={true}
              onSave={(data) => saveAuxItem("campanhas", data)}
              onDelete={(id) => deleteAuxItem("campanhas", id)}
              formSchema={z.object({
                id: z.number().optional(),
                nome: z.string().min(2, "Nome obrigatório"),
                mes: z.string().min(1, "Selecione o mês"),
                cor: z.string().min(1, "Selecione a cor"),
                status: z.string().min(1, "Selecione o status"),
              })}
              renderFormFields={(form: any) => (
                <>
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Campanha</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Agosto Lilás" {...field} />
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
                        <FormLabel>Mês de Referência</FormLabel>
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
                        <FormLabel>Cor da Campanha</FormLabel>
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
                          <InfoTooltip text="Define se a campanha está ativa, inativa ou arquivada." />
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
                              <SelectItem value="draft">Inativo</SelectItem>
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
