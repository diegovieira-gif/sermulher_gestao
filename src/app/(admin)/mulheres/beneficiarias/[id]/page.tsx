import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeneficiosTab } from "./beneficios-tab";
import { getBeneficiaria, getHistoricoBeneficios } from "../actions";
import { getAuxItems } from "../../../configuracoes/actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BeneficiariaDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const beneficiariaId = Number(id);

  if (Number.isNaN(beneficiariaId)) {
    return notFound();
  }

  const [beneficiariaResult, historicoResult, beneficiosResult] = await Promise.all([
    getBeneficiaria(beneficiariaId),
    getHistoricoBeneficios(String(beneficiariaId)),
    getAuxItems("config_beneficios"),
  ]);

  if (!beneficiariaResult.success || !beneficiariaResult.data) {
    return notFound();
  }

  const beneficiaria = beneficiariaResult.data;
  const historico = historicoResult.success && historicoResult.data ? historicoResult.data : [];
  const beneficios = beneficiosResult.success && beneficiosResult.data ? beneficiosResult.data : [];

  const contato = typeof beneficiaria.contato === "string"
    ? safeJsonParse(beneficiaria.contato, {})
    : beneficiaria.contato || {};

  const endereco = typeof beneficiaria.endereco === "string"
    ? safeJsonParse(beneficiaria.endereco, {})
    : beneficiaria.endereco || {};

  const enderecoFormatado = endereco.logradouro
    ? `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro || ""}`
    : "Endereço não informado";

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/mulheres/beneficiarias" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm text-muted-foreground">Beneficiária</p>
            <h1 className="text-2xl font-bold leading-tight">{beneficiaria.nome_completo}</h1>
          </div>
        </div>
        {beneficiaria.cpf ? (
          <Badge variant="outline" className="font-mono">
            CPF: {beneficiaria.cpf}
          </Badge>
        ) : null}
      </header>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contato</p>
                  <p className="font-medium text-foreground">{contato.telefone || "Não informado"}</p>
                  {contato.email && (
                    <p className="text-sm text-muted-foreground">{contato.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium text-foreground">{enderecoFormatado}</p>
                  {endereco.cidade && (
                    <p className="text-sm text-muted-foreground">{endereco.cidade}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beneficios">
          <BeneficiosTab
            beneficiariaId={beneficiaria.id}
            beneficiariaNome={beneficiaria.nome_completo}
            beneficiosOptions={beneficios}
            historico={historico}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function safeJsonParse(value: string, fallback: Record<string, unknown>) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
