"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericCrudTable } from "./generic-crud-table";
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
  campanhas: any[];
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as tabelas auxiliares do sistema
        </p>
      </div>

      <Tabs defaultValue="origens" className="w-full">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="origens">Origens</TabsTrigger>
          <TabsTrigger value="prioridades">Prioridades</TabsTrigger>
          <TabsTrigger value="tipos-evento">Tipos de Evento</TabsTrigger>
          <TabsTrigger value="tipos-violencia">Tipos de Violência</TabsTrigger>
          <TabsTrigger value="encaminhamentos">Encaminhamentos</TabsTrigger>
          <TabsTrigger value="periculosidade">Periculosidade</TabsTrigger>
          <TabsTrigger value="locais">Locais</TabsTrigger>
          <TabsTrigger value="bairros">Bairros</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
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
            hasGrupoRma={true}
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

        <TabsContent value="campanhas" className="mt-6">
          <GenericCrudTable
            collectionName="campanhas"
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
              nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
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
            renderFormFields={(form: any) => (
              <>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
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
                      <FormLabel>Mês</FormLabel>
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
                      <FormLabel>Cor</FormLabel>
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
                      <FormLabel>Status</FormLabel>
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
                            <SelectItem value="archived">Arquivado</SelectItem>
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
      </Tabs>
    </div>
  );
}
