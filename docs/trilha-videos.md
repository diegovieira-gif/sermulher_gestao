# Trilha de vídeos — SIGMA / SerMulher

Curso em vídeo para a equipe da Secretaria, derivado do comportamento real do
sistema (o código), do Manual do Usuário (`MANUAL.md` e a página `/manual`) e do
que a equipe faz no dia a dia. Os roteiros de cada aula estão em
[`aulas/`](aulas/README.md).

## Como esta trilha foi montada

**Ordenada por dependência, não por menu.** A equipe não aprende na ordem do
sidebar — aprende na ordem em que o trabalho acontece: primeiro entrar e
encontrar, depois cadastrar, depois registrar o que foi feito, e só então
extrair relatórios. Um vídeo nunca usa algo que ainda não foi ensinado.

**Vídeos curtos, um objetivo cada.** A maioria tem dois minutos; nenhum passa de seis. A pessoa que
esquece "como registro participação em evento" precisa achar *aquele* vídeo, não
percorrer 20 minutos de gravação.

**Cada vídeo termina em uma tarefa executável.** Quem assiste faz, no sistema,
o que acabou de ver. Sem isso vira apresentação, não treinamento.

**Módulos por público.** Todo mundo faz os módulos 0 e 1. Daí em diante cada
equipe segue o seu: o CRAM não precisa da Sala Azul, a Escola não precisa do
CRAM. A coluna *Público* do resumo diz quem faz o quê.

**O que NÃO entra:** telas em construção, dívidas técnicas e qualquer coisa que
possa mudar nas próximas semanas. Vídeo desatualizado ensina errado — e dá mais
trabalho corrigir do que nunca ter gravado. Os pontos deixados de fora estão
listados no fim, com o motivo.

## Regras dos roteiros

1. **A fala cita o NOME da tela, nunca a posição.** "Clique em Nova
   Beneficiária", e não "o botão do canto direito" ou "o terceiro item do
   menu". Mudar o layout não pode obrigar a regravar a fala. (Lição do
   `curso_inteligente`, onde isso foi o que mais economizou retrabalho.)
2. **Números por extenso na narração.** O texto vai direto para a voz
   sintética: "cinco tentativas", não "5 tentativas". Siglas ficam como se
   escrevem e o glossário [`aulas/pronuncia.json`](aulas/pronuncia.json) diz
   como cada uma é falada.
3. **Só dados fictícios, e sempre os mesmos.** Todo nome, CPF e telefone que
   aparece na tela vem de [`aulas/elenco.json`](aulas/elenco.json). Um vídeo com
   o nome real de uma mulher atendida é um vazamento que não se desfaz.
4. **Sigilo é conteúdo, não rodapé.** Toda aula que mostra dado sensível
   lembra, na própria fala, quem pode ver aquilo e por quê.
5. **O que o sistema NÃO faz também se diz.** O selo de risco não é
   diagnóstico; exportar não é backup. A dúvida que a aula deixa aberta vira
   erro no atendimento.

---

## Módulo 0 — Antes de começar (3 vídeos, ~7 min)

Público: todos.

### 0.1 — O que é o SIGMA e o que ele resolve · 3 min
- O problema: dados da mesma mulher espalhados em cadernos, planilhas e memória.
- Cadastro único: a beneficiária existe uma vez, e tudo se liga a ela.
- Passeio pelos módulos, sem entrar em nenhum.
- **Sigilo:** o sistema guarda dados de mulheres em situação de violência. Quem
  vê o quê depende do perfil.
- *Tarefa:* nenhuma. É o único vídeo puramente expositivo da trilha.

### 0.2 — Entrar, se localizar e sair · 2 min
- Login; o limite de tentativas e por que ele é por conta.
- Menu lateral, recolher e abrir; o próprio nome e o menu do usuário.
- Por que o menu de cada pessoa é diferente do da colega.
- **Tema claro, escuro ou do sistema** — o seletor no topo.
- Sair do sistema.
- *Tarefa:* entrar, escolher o tema e localizar o Manual do Usuário no menu.

### 0.3 — Meu Perfil e os avisos do sistema · 2 min
- **Meu Perfil:** dados, atividade e troca de senha.
- O **sino**: o que chega ali e como marcar como lido.
- Avisos por **WhatsApp**: só com a autorização da própria pessoa.
- *Tarefa:* trocar a senha e decidir se quer receber avisos por WhatsApp.

---

## Módulo 1 — Beneficiárias, o coração do sistema (6 vídeos, ~14 min)

Público: todos que atendem. **Pré-requisito de todos os módulos seguintes.**

### 1.1 — Cadastrar uma beneficiária · 3 min
- Só o **nome** é obrigatório: cadastre com o que tem, complete depois.
- A verificação de CPF que evita duplicidade — e por que duplicar é caro.
- *Tarefa:* cadastrar uma beneficiária fictícia com nome e CPF.

### 1.2 — Completude: por que a ficha "pede mais" · 3 min
- O resumo que aparece ao salvar e o que ele mede.
- Por que **telefone** e **bairro** pesam mais: sem eles, ela não recebe
  campanha e some do recorte territorial.
- **Completar agora** continua na mesma ficha — não cria um segundo cadastro.
- Telefone validado é confirmação, não preenchimento.
- *Tarefa:* levar a ficha do vídeo 1.1 acima de setenta por cento.

### 1.3 — Encontrar quem você procura · 3 min
- Busca por nome, CPF ou telefone; filtros por bairro e marcadores.
- Os ícones da linha: resumo, ficha completa, vínculos, editar, excluir.
- **O ponto que mais confunde:** o lápis abre só os dados; as abas ficam na
  ficha completa.
- *Tarefa:* achar a beneficiária cadastrada e abrir a aba Eventos por dois
  caminhos diferentes.

### 1.4 — A ficha completa e a linha do tempo · 2 min
- As abas da ficha: dados, linha do tempo, benefícios, eventos e cursos.
- **Linha do Tempo:** o resumo do caso antes de um atendimento.
- Registrar uma entrega de benefício.
- *Tarefa:* registrar uma entrega de benefício e vê-la na linha do tempo.

### 1.5 — Não perca o preenchimento: o rascunho automático · 2 min
- O que é salvo sozinho, onde, e por quanto tempo.
- **Recuperar** ou **Descartar**: a faixa que aparece ao reabrir.
- O aviso ao fechar a aba e o aviso de pendência em outra aba.
- *Tarefa:* começar um cadastro, fechar a aba e recuperar o que foi digitado.

### 1.6 — Exportar dados · 2 min
- Exportar tudo ou só as linhas marcadas.
- O que vem no arquivo e como abrir no Excel.
- **Exportar não é backup** — e o que isso significa na prática.
- *Tarefa:* exportar três registros selecionados e conferir as colunas.

---

## Módulo 2 — Atendimentos e demandas (3 vídeos, ~6 min)

Público: atendimento, psicossocial e jurídico.

### 2.1 — Registrar um atendimento · 2 min
- Abrir um atendimento: beneficiária, origem, prioridade, tipo de violência.
- As abas do atendimento e o relatório técnico.
- *Tarefa:* registrar um atendimento para a beneficiária do módulo 1.

### 2.2 — Encaminhar: tramitações entre setores · 2 min
- **Nova Tramitação:** tipo de demanda, setor responsável, etapa e relato.
- A evolução do caso como histórico, e não como campo que se sobrescreve.
- *Tarefa:* encaminhar o atendimento do 2.1 para outro setor.

### 2.3 — Gestão de Demandas: o que está com cada setor · 2 min
- **Quadro** e **Lista**: a mesma fila vista de dois jeitos.
- Buscar por nome ou CPF; filtrar por setor.
- **Abrir Prontuário** a partir da demanda.
- Quem vê quais demandas depende do perfil (ver 8.4).
- *Tarefa:* encontrar a demanda criada no 2.2 e abrir o prontuário por ela.

---

## Módulo 3 — Agenda Institucional (5 vídeos, ~10 min)

Público: quem organiza ações, eventos e campanhas.

### 3.1 — Criar um evento com data e horário · 2 min
- **Novo Evento** com **data e hora** — o horário aparece no calendário.
- A coluna **Período**: um dia, com horário, vários dias.
- *Tarefa:* criar um evento para a semana que vem, das catorze às dezesseis horas.

### 3.2 — Encontrar, filtrar e exportar eventos · 2 min
- Busca por título ou local, em toda a base.
- Ordenação e filtros por tipo, categoria e situação.
- O link guarda a consulta; **Exportar CSV** leva o recorte inteiro.
- *Tarefa:* listar os eventos encerrados de uma categoria e exportá-los.

### 3.3 — Quem participou: os dois caminhos · 2 min
- Pelo **evento**: lançar a lista de presença de uma ação inteira.
- Pela **beneficiária**: registrar durante o atendimento.
- É o mesmo registro — e o sistema recusa duplicidade.
- A data sugerida e o aviso de data fora do período.
- *Tarefa:* lançar três participantes pelo evento e conferir na ficha de uma delas.

### 3.4 — A equipe do evento e os avisos de escala · 2 min
- **Equipe:** quem trabalhou, diferente de quem participou.
- Os avisos automáticos: escala, véspera, retirada e mudança de data ou local.
- *Tarefa:* escalar duas colegas e conferir o aviso no sino.

### 3.5 — Calendário visual: legenda que filtra e agenda impressa · 2 min
- As três origens e suas cores: eventos, Escola e Sala Azul.
- **A legenda é um filtro.**
- **Imprimir a agenda** gera um documento, não uma foto da tela.
- *Tarefa:* imprimir em PDF a agenda do mês só com os eventos da Escola.

---

## Módulo 4 — CRAM (3 vídeos, ~7 min)

Público: **apenas a equipe do CRAM.** Módulo independente dos demais.

### 4.1 — O Instrumental na tela · 2 min
- O formulário de papel virou quatro abas.
- Os dados pessoais vêm do prontuário; aqui fica a história do atendimento.
- Só assistida e data são obrigatórias — preencha ao longo dos encontros.
- *Tarefa:* abrir um instrumental e preencher a aba Atendimento.

### 4.2 — Partes I, II e III, e o nível de risco · 2 min
- Socioassistencial, com a composição domiciliar em tabela.
- Jurídico e psicológico.
- **Nível de risco:** o que o selo Alto, Médio ou Baixo significa — e o que ele
  **não** significa. É fila de atenção, não diagnóstico.
- *Tarefa:* completar as três partes de um instrumental de teste.

### 4.3 — Plano Individual (PIA) · 2 min
- Histórico, pactuações, formas de participação.
- Evolução como diário: cada registro com data e técnico.
- Salvar o plano antes de evoluir.
- *Tarefa:* abrir um PIA e registrar duas evoluções.

---

## Módulo 5 — Escola da Mulher (4 vídeos, ~6 min)

Público: equipe da Escola da Mulher.

### 5.1 — Cursos e turmas · 2 min
- O **catálogo de cursos**: nome, área, carga horária e ementa.
- **Turma** é o curso acontecendo: datas, instrutor, vagas e status.
- *Tarefa:* criar uma turma de um curso existente.

### 5.2 — Matricular alunas · 1 min
- **Adicionar Aluna à Turma**: a aluna precisa estar cadastrada como beneficiária.
- Remover uma matrícula — e o que isso não apaga.
- A tela de **Matrículas** como visão geral.
- *Tarefa:* matricular duas alunas na turma do 5.1.

### 5.3 — Diário de classe: a frequência · 1 min
- Lançar a presença de uma aula pela data.
- Por que a frequência é a base do certificado.
- *Tarefa:* lançar a presença de duas aulas.

### 5.4 — Resultados e certificados · 2 min
- A aba **Resultados**: quem concluiu.
- Emitir e imprimir o certificado.
- A matrícula aparece na ficha da beneficiária, aba Cursos.
- *Tarefa:* emitir o certificado de uma aluna e salvar em PDF.

---

## Módulo 6 — Sala Azul (4 vídeos, ~7 min)

Público: equipe da Sala Azul. **Atenção:** aqui o cadastro é de autores de
violência, e não de beneficiárias. Os dois nunca se misturam.

### 6.1 — Cadastrar um participante (autor) · 2 min
- Dados pessoais, número do processo, **nível de risco** e **status legal**.
- O alerta de risco no painel.
- *Tarefa:* cadastrar um participante fictício.

### 6.2 — Ciclos reflexivos e participantes · 1 min
- **Novo Ciclo:** nome, período, local e facilitador.
- **Adicionar Participante** ao ciclo.
- *Tarefa:* criar um ciclo e incluir dois participantes.

### 6.3 — Sessões e lista de presença · 2 min
- **Nova Sessão:** data e tema.
- A lista de presença de cada sessão.
- *Tarefa:* criar duas sessões e lançar a presença.

### 6.4 — Avaliação, relatório ao Judiciário e certificado · 2 min
- **Avaliar participante:** frequência, status e parecer psicológico.
- O **relatório individual** de acompanhamento — o documento que vai ao
  Judiciário.
- O certificado.
- *Tarefa:* avaliar um participante e gerar o relatório em PDF.

---

## Módulo 7 — Comunicação (4 vídeos, ~9 min)

Público: equipe de comunicação.

### 7.1 — Mídias sociais: registrar publicações · 1 min
- **Novo Registro:** pauta, data, canal, formato, alcance.
- O painel: publicações por canal e alcance acumulado.
- *Tarefa:* registrar as publicações da semana.

### 7.2 — Campanhas por WhatsApp · 3 min
- **Modelos de campanha** e a mensagem com o primeiro nome.
- **Mulheres elegíveis:** quem tem telefone na ficha — e por isso o telefone
  importa (fecha o ciclo do 1.2). O sistema **não** pede autorização da
  beneficiária: a aula ensina a escrever sem revelar o atendimento, porque o
  celular dela pode estar nas mãos do agressor.
- O disparo e a linha do tempo de disparos.
- *Tarefa:* montar uma campanha e conferir o público antes de disparar.

### 7.3 — App Amar: o conteúdo do aplicativo · 2 min
- O que o público vê no aplicativo e onde se mantém cada parte: categorias,
  serviços, campanhas, cursos e projetos.
- **Contatos:** as mensagens que chegam pelo site público.
- *Tarefa:* cadastrar um serviço numa categoria existente.

### 7.4 — Criar e enviar campanhas: a Avaliação de Atendimento · 3 min
- **Criar Campanha:** nome, objetivo, mensagem com o primeiro nome, tipo de
  envio (manual ou automática).
- **Enviar uma campanha já cadastrada** — a Campanha de Avaliação de
  Atendimento: rever a mensagem, o aviso de **reenvio** (campanha já
  enviada pede confirmação) e a escolha do público.
- Antes de disparar: **Testar Conexão** e, se estiver offline, **Conectar
  WhatsApp** pelo QR Code. O **Histórico de Envio**.
- *Tarefa:* abrir a campanha de avaliação, filtrar o público e conferir —
  sem disparar.

---

## Módulo 8 — Coordenação (5 vídeos, ~9 min)

Público: coordenação e administradores.

### 8.1 — O painel e o período de referência · 2 min
- Os indicadores do Dashboard e o que cada um conta.
- Mudar o mês de referência: o que muda e o que não muda.
- *Tarefa:* comparar os atendimentos de dois meses.

### 8.2 — Relatórios: RMA e indicadores · 2 min
- **RMA (SUAS)** e **Indicadores Gerais**.
- **De onde vêm os números:** raça/cor, escolaridade e nascimento alimentam os
  relatórios — ficha incompleta é relatório incompleto. Fecha o ciclo do 1.2.
- Imprimir em PDF e exportar CSV.
- *Tarefa:* gerar o RMA do mês e exportar o CSV.

### 8.3 — Observatório · 1 min
- O que é alimentado à mão e onde aparece.
- Períodos e séries.
- *Tarefa:* lançar o valor de uma série para o período corrente.

### 8.4 — Controle de acesso por perfil · 2 min
- Perfis, **Permissões de Menu** e **Acesso a Demandas**.
- **A armadilha:** perfil sem a política "App Padrão" entra e não vê dado
  nenhum; perfil sem menu configurado vê tudo.
- A página **Acesso não permitido**.
- *Tarefa:* liberar dois módulos para um perfil de teste e entrar com ele.

### 8.6 — Configurações e tabelas auxiliares · 2 min
- As tabelas que alimentam os formulários: bairros, tipos de violência,
  setores, benefícios, tipos de evento.
- **Mudar aqui muda todos os formulários**, na hora.
- *Tarefa:* cadastrar um tipo de evento e vê-lo aparecer no formulário.

---

## Resumo

| Módulo | Vídeos | Duração | Público |
|---|---|---|---|
| 0 — Antes de começar | 3 | ~7 min | Todos |
| 1 — Beneficiárias | 6 | ~14 min | Todos que atendem |
| 2 — Atendimentos e demandas | 3 | ~6 min | Atendimento, psicossocial, jurídico |
| 3 — Agenda Institucional | 5 | ~10 min | Quem organiza ações |
| 4 — CRAM | 3 | ~7 min | Equipe CRAM |
| 5 — Escola da Mulher | 4 | ~6 min | Equipe da Escola |
| 6 — Sala Azul | 4 | ~7 min | Equipe da Sala Azul |
| 7 — Comunicação | 3 | ~6 min | Comunicação |
| 8 — Coordenação | 5 | ~9 min | Coordenação |
| **Total** | **36** | **~73 min** | |

**Trilha mínima para começar a trabalhar:** módulos 0 e 1 — 9 vídeos, ~21 minutos.

---

## O que ficou de fora, e por quê

| Ponto | Motivo |
|---|---|
| **Configuração de Integração** das Campanhas WhatsApp (endereço do serviço, usuário e senha) | Tarefa de TI, feita uma vez. Mostrar credencial em vídeo seria também um risco. |
| Campos de **UUID** no App Amar (imagem de capa, áudio) | Dívida técnica: pedem o identificador interno de um arquivo do Directus colado à mão. Ensinar isso perpetua o problema; quando houver upload, a aula ganha uma cena. |
| Criar **perfis** e usuários no Directus | Fora do app; é procedimento de TI. A aula 8.4 trata do que se faz dentro do SIGMA. |
| **Auditoria** (era a 8.5) | Retirada em 10/2026: a tela mostra ações reais das servidoras, com IP e navegador, e não há como gravá-la sem expor isso. Tela de uso da administração; o Manual do Usuário a descreve. |
| Telas de detalhe do **Observatório** além de períodos e séries | Uso esporádico e restrito; entram se a coordenação pedir. |

---

## Notas de produção

**Dados de demonstração.** Nenhuma gravação pode usar dados reais. O elenco
fictício está em [`aulas/elenco.json`](aulas/elenco.json), e uma instância de
demonstração deve ser povoada com ele antes da captura.

**O que gravar por último.** Aulas de funcionalidades recentes — completude
(1.2), horário do evento (3.1), equipe e avisos (3.4), tema (0.2) — devem ir
para a narração definitiva só depois que o uso real confirmar que não haverá
ajuste.

**Refazer é normal.** Quando uma tela mudar, a cena daquela tela é refeita
sozinha — foi por isso que a trilha foi fatiada assim, e por isso a imagem é
captura + zoom, e não gravação contínua.
