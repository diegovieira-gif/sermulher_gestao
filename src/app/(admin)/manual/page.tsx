import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Book,
  LayoutDashboard,
  HeartHandshake,
  GraduationCap,
  ShieldAlert,
  GitPullRequest,
  Calendar,
  FileText,
  Sparkles,
  Megaphone,
  Settings,
} from "lucide-react";

export default function ManualPage() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div className="space-y-4 text-center md:text-left border-b pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 flex items-center justify-center md:justify-start gap-3">
          <Book className="h-10 w-10 text-purple-600" />
          Manual do Usuário
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl">
          Guia completo de utilização do Sistema SerMulher. Aprenda a gerenciar
          atendimentos, cursos e relatórios de forma eficiente.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Seção 1: Dashboard e IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-blue-600" />
              1. Visão Geral e Inteligência Artificial
            </CardTitle>
            <CardDescription>
              Primeiros passos e uso do assistente inteligente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="dash-1">
                <AccordionTrigger>Como funciona o Dashboard?</AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  O Dashboard é sua tela inicial. Ele exibe indicadores em tempo
                  real (KPIs) como total de atendimentos no mês e casos ativos.
                  Os gráficos mostram a evolução temporal dos atendimentos e a
                  Agenda Rápida mostra seus próximos compromissos.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="dash-2">
                <AccordionTrigger className="text-purple-700 font-semibold">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Como usar a Assistente IA?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  No topo do Dashboard existe um campo de pergunta. Você pode
                  digitar perguntas em linguagem natural, como:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>
                      "Quantas mulheres foram atendidas no bairro Centro?"
                    </li>
                    <li>"Qual o tipo de violência mais comum este mês?"</li>
                    <li>"Liste os infratores de alto risco."</li>
                  </ul>
                  A IA analisará o banco de dados e responderá com números,
                  listas ou gráficos automaticamente.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Seção 2: Gestão de Mulheres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-pink-600" />
              2. Gestão de Mulheres (Core)
            </CardTitle>
            <CardDescription>
              Cadastro, triagem e prontuário eletrônico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="mulher-1">
                <AccordionTrigger>
                  Cadastrando uma nova beneficiária
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 space-y-2">
                  <p>
                    Acesse{" "}
                    <strong>Gestão de Mulheres {">"} Beneficiárias</strong> e
                    clique em "Nova Beneficiária".
                  </p>
                  <p>
                    <Badge variant="outline" className="mr-1">
                      Novidade
                    </Badge>
                    Agora o cadastro é simplificado!{" "}
                    <strong>Apenas o Nome Completo é obrigatório</strong>{" "}
                    inicialmente. Dados como CPF, Endereço e Telefone podem ser
                    preenchidos posteriormente à medida que o atendimento
                    avança.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="mulher-2">
                <AccordionTrigger>Busca e Exportação de Dados</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Na tela de listagem de beneficiárias, utilize a{" "}
                  <strong>Barra de Busca</strong> para encontrar rapidamente uma
                  mulher por Nome ou CPF.
                  <br />
                  <br />
                  Para gerar relatórios, clique no botão{" "}
                  <strong>"Exportar CSV"</strong>. O sistema baixará um arquivo
                  compatível com Excel contendo a lista filtrada atual.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="mulher-3">
                <AccordionTrigger>Registrando um Atendimento</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  No perfil da mulher, clique em "Novo Atendimento". Selecione o
                  tipo de violência (se houver) e relate o ocorrido. O sistema
                  gerará automaticamente um número de protocolo e iniciará o
                  Prontuário Eletrônico.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="mulher-4">
                <AccordionTrigger>
                  Tramitações (Encaminhamentos)
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Dentro de um atendimento, use a aba "Tramitações" para enviar
                  o caso para outro setor (ex: Jurídico, Psicossocial). Isso
                  criará uma pendência na "Gestão de Demandas" do setor destino.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Seção 3: Gestão de Demandas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-orange-600" />
              3. Fluxo e Organização
            </CardTitle>
            <CardDescription>
              Kanban de demandas e Agenda Institucional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="kanban-1">
                <AccordionTrigger>Gestão de Demandas (Kanban)</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Visualize todas as pendências em um quadro visual. Mova os
                  cartões entre <strong>Aguardando</strong>,{" "}
                  <strong>Em Análise</strong> e <strong>Concluído</strong>. Use
                  os filtros para ver apenas as demandas do seu setor.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="kanban-2">
                <AccordionTrigger>Agenda Institucional</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  A Agenda unifica eventos manuais, aulas da Escola e sessões da
                  Sala Azul. Use a aba <strong>"Calendário Visual"</strong> para
                  ver o mês e a aba <strong>"Lista de Gestão"</strong> para
                  cadastrar, editar ou excluir eventos.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Seção 4 e 5: Escola e Sala Azul */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                4. Escola da Mulher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="escola-1">
                  <AccordionTrigger>Painel da Escola</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600">
                    O novo Painel da Escola exibe estatísticas rápidas: turmas
                    ativas, total de alunas e cursos disponíveis. Use os atalhos
                    para navegar rapidamente.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="escola-2">
                  <AccordionTrigger>
                    Gestão de Turmas e Matrículas
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600">
                    Crie turmas para cursos profissionalizantes. Você pode
                    matricular beneficiárias e acompanhar a frequência. O
                    sistema emite certificados automaticamente para alunas com
                    mais de 75% de presença.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-indigo-600" />
                5. Sala Azul (Infratores)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="sala-1">
                  <AccordionTrigger>Grupos Reflexivos</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600">
                    Cadastre os autores de violência encaminhados pelo
                    judiciário. Eles devem ser vinculados a "Ciclos Reflexivos".
                    O sistema monitora a presença obrigatória em cada sessão do
                    ciclo.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Seção 6 e 7: Marketing e Configurações */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4 text-pink-500" />
                6. Marketing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="mkt-1">
                  <AccordionTrigger>Campanhas e Métricas</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600">
                    Gerencie campanhas de conscientização (ex: Outubro Rosa).
                    Acompanhe métricas de alcance e engajamento das redes
                    sociais para gerar relatórios de impacto.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4 text-gray-500" />
                7. Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="config-1">
                  <AccordionTrigger>Padronização do Sistema</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600">
                    Acesse este menu para cadastrar novos{" "}
                    <strong>Bairros</strong>,{" "}
                    <strong>Tipos de Violência</strong> ou{" "}
                    <strong>Cursos</strong>. Tudo que for cadastrado aqui
                    aparecerá automaticamente nas opções dos formulários.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Seção 8: Relatórios Oficiais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              8. Relatórios Oficiais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="relat-1">
                <AccordionTrigger>RMA (SUAS)</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  O sistema gera automaticamente o Registro Mensal de
                  Atendimentos. Vá em Relatórios {" > "} RMA, selecione o
                  mês/ano e clique em "Imprimir". O layout já sai formatado para
                  assinatura.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-400 pt-8 pb-4">
        <p>SerMulher Gestão Integrada © {new Date().getFullYear()}</p>
        <p>Desenvolvido para facilitar e humanizar o atendimento.</p>
      </div>
    </div>
  );
}
