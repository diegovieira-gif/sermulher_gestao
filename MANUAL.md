# Manual de Operação - Sistema SerMulher

Bem-vindo ao sistema de gestão integrada da **Secretaria Municipal do Respeito às Políticas para as Mulheres**. Este manual guia você pelas principais funcionalidades da plataforma.

---

## 1. Visão Geral (Dashboard)

Ao entrar no sistema, você verá o **Painel de Controle** com indicadores em tempo real:

- **Atendimentos do Mês:** Total de mulheres atendidas no período atual.
- **Mulheres Ativas:** Quantidade de prontuários em acompanhamento contínuo.
- **Eventos:** Agenda dos próximos 7 dias.
- **Pendências:** Casos que aguardam triagem ou ação imediata.

### Mudar o período de referência

No topo do painel há um seletor de **mês/ano**. Os indicadores mensais (atendimentos, encaminhamentos, benefícios e o gráfico) passam a refletir o período escolhido — útil para responder "como foi em junho?". Os totais acumulados (beneficiárias cadastradas, turmas ativas etc.) não mudam, pois não são mensais. O padrão é sempre o mês corrente.

---

## 2. Gestão de Mulheres (Prontuário)

Módulo destinado ao acolhimento e registro de atendimentos psicossociais e jurídicos.

### Cadastrar Nova Mulher

1. Acesse o menu lateral **"Gestão de Mulheres"**.
2. Clique no botão **"+ Nova Mulher"**.
3. Preencha os dados obrigatórios (Nome, CPF, Data de Nascimento).
4. O sistema verifica automaticamente se o CPF já existe para evitar duplicidade.

### Registrar Atendimento

1. No perfil da mulher, clique na aba **"Atendimentos"**.
2. Clique em **"Novo Atendimento"**.
3. Selecione o **Tipo de Violência** (ex: Física, Psicológica) e o **Sigilo**.
4. Descreva o relato técnico e salve. O histórico é gerado cronologicamente.

### Eventos, Cursos e Benefícios da beneficiária

**Como chegar à ficha completa:** na lista de beneficiárias, clique no **nome** dela — ou no botão de **ficha** (ícone de documento) na linha. O botão de lápis abre apenas o formulário de dados cadastrais, sem as abas.

**Atalho para uma aba:** o botão de **vínculos** (ícone de elo, em verde-azulado) abre um menu com Benefícios, Eventos e Cursos, levando à aba escolhida já aberta. O endereço da aba é fixo, então dá para salvar ou compartilhar o link.

Na ficha da beneficiária, as abas **Eventos**, **Cursos** e **Benefícios** registram a participação dela em eventos/campanhas e cursos, além das entregas de benefícios. Clique em **Registrar**, escolha o item, informe a data e uma observação opcional.

Ao escolher um evento, a **data é sugerida automaticamente**: se hoje está dentro do período do evento, hoje; caso contrário, a data de início dele. O período aparece abaixo do campo, e um aviso surge se a data informada ficar fora dele — é apenas um alerta, não um bloqueio, já que registrar depois pode ser legítimo.

Pelo lado do evento existe a visão inversa — a lista de quem participou. Veja a seção **Agenda Institucional**.

### Linha do Tempo

A aba **Linha do Tempo** da ficha reúne, em ordem cronológica, **tudo o que aconteceu com a beneficiária**: atendimentos abertos, instrumentais do CRAM, benefícios entregues, eventos e cursos. É o resumo do caso para consultar antes de um atendimento — cada item com tela própria (atendimento, CRAM) é clicável e abre o registro completo.

### Rascunho automático (não perca o preenchimento)

Os formulários grandes — **beneficiária**, **atendimento** e **Instrumental CRAM** — salvam automaticamente um **rascunho no computador** enquanto você digita. Se a sessão expirar, a aba fechar sem querer ou faltar energia:

1. Reabra o mesmo formulário.
2. Uma faixa amarela oferece **Recuperar** (volta tudo como estava) ou **Descartar**.

O rascunho é apagado quando o registro é salvo com sucesso e expira sozinho após 24 horas. O navegador também passa a **avisar antes de fechar** a aba quando há alterações não salvas. Se um campo obrigatório de outra aba impedir o salvamento, um aviso indica **em qual aba** está a pendência.

### Completude da ficha

Ao salvar um cadastro, o sistema mostra o quanto a ficha está **completa** e lista o que falta, do mais importante para o menos. Os campos têm pesos diferentes: telefone e bairro pesam mais porque sem eles a beneficiária fica fora das campanhas; raça/cor e escolaridade alimentam os relatórios oficiais.

Use **Completar agora** para voltar aos campos sem sair da ficha — o registro já foi salvo, e continuar preenchendo atualiza o mesmo cadastro.

O aviso de **telefone não validado** aparece à parte: um telefone preenchido mas não confirmado com a beneficiária é diferente de um telefone ausente.

### Exportar para CSV

O botão **Exportar CSV** baixa a lista atual (respeitando a busca) com **todos os campos gravados** — identificação, contato, endereço, dados sociais, marcadores e quem criou/alterou o registro. Selecionando linhas com a caixa de seleção, a exportação cobre apenas as selecionadas.

O arquivo abre no Excel com os acentos corretos. Os valores saem como estão gravados, sem tradução, para que o arquivo sirva de conferência e reposição de dados.

> **Não substitui backup.** O arquivo cobre apenas as beneficiárias. Atendimentos, CRAM, tramitações e os vínculos entre eles não estão nele — para isso é preciso backup do banco.

### Busca, filtros e telefone validado

- Use os **Filtros** para refinar a lista por **bairro**, ordenação e marcadores (Medida Protetiva, Bolsa Família, BPC); os filtros ativos aparecem como etiquetas removíveis.
- No cadastro, marque **Telefone validado** quando o número for confirmado com a beneficiária.

---

## 3. CRAM (Instrumental de Atendimento)

Centro de Referência de Atendimento à Mulher em Situação de Violência. Este módulo reproduz o **Instrumental de Atendimento** em papel — o formulário longo do acolhimento. Ele é separado do cadastro de beneficiárias: lá ficam os dados pessoais, aqui fica a história do atendimento.

### Registrar um atendimento

1. Acesse **CRAM** > **Novo Atendimento**.
2. Busque a **assistida** pelo nome ou CPF (ela precisa estar cadastrada em Gestão de Mulheres).
3. Informe data e turno e percorra as quatro abas.
4. Clique em **Registrar atendimento**.

Só **assistida** e **data** são obrigatórias — deixe o status em *Em preenchimento* e complete nos próximos encontros.

### As quatro abas

- **Atendimento:** como chegou ao serviço (espontânea ou encaminhada), medida protetiva, serviço buscado, RG e Cartão SUS.
- **I · Socioassistencial:** imóvel e saneamento, deficiência, saúde (tabagismo, drogas, álcool), renda e benefícios, **composição domiciliar**, endereço alternativo, serviços que frequenta, caracterização da violência e identificação do autor.
- **II · Jurídico:** necessidade de orientação jurídica, Boletim de Ocorrência (inclusive se feito por nós durante o atendimento) e órgão de encaminhamento.
- **III · Psicológico:** as seis perguntas padronizadas de risco e o resumo da psicóloga.

### Nível de risco

A lista exibe um selo por atendimento, contando as respostas **"Sim"** entre as seis perguntas da aba Psicológico: **Alto** (4+), **Médio** (2–3), **Baixo** (1) e **Sem sinais**. É um apoio para priorizar a fila de atenção — não substitui a avaliação técnica nem define conduta.

### Plano Individual de Atendimento (PIA)

Dentro de um atendimento, a aba **Plano Individual (PIA)** registra o histórico da demanda, as **pactuações com a usuária** (demanda identificada, serviço ofertado, ação realizada) e as **formas de participação** da assistida. A **evolução do acompanhamento** funciona como um diário, com data, descrição e técnico responsável em ordem cronológica. Salve o plano uma primeira vez para liberar o registro de evoluções.

> **Acesso:** o CRAM aparece apenas para os perfis liberados em Configurações → Permissões de Menu. Perfis com acesso restrito não o recebem automaticamente.

---

## 4. Escola (Cursos e Oficinas)

Gestão da autonomia financeira através de qualificação profissional.

### Criar Turma

1. Acesse o menu **"Escola"** > **"Turmas"**.
2. Clique no botão **"+ Criar Turma"**.
3. Defina o Curso, Professor, Turno e Datas (Início/Fim).
4. O status da turma muda automaticamente (Aberta, Em Andamento, Concluída) conforme as datas.

### Matricular Aluna

1. Entre na Turma desejada.
2. Busque a aluna pelo nome ou CPF (deve estar cadastrada na base de Mulheres).
3. Confirme a matrícula. O sistema gera a lista de presença e permite emissão de **Certificados** ao final.

---

## 5. Sala Azul (Grupos Reflexivos)

Acompanhamento de homens autores de violência (Lei Maria da Penha).

### Cadastro de Infrator

1. Acesse **"Sala Azul"** > **"Participantes"**.
2. Cadastre os dados e o **Nº do Processo**.
3. Vincule o **Nível de Risco** e **Status Legal**.

### Gestão de Ciclos (Sessões)

1. Crie um **Ciclo** (ex: "Grupo Reflexivo 2024.1").
2. Adicione **Sessões** com temas específicos (ex: "Masculinidade", "Violência Patrimonial").
3. Em cada sessão, registre a **Presença** dos participantes. O sistema calcula a frequência para relatórios ao Judiciário.

---

## 6. Agenda Institucional (Eventos)

Calendário unificado da Secretaria.

- **Visualização:** O calendário mostra automaticamente:
  - Início e Fim de Turmas (Verde).
  - Sessões da Sala Azul (Azul).
  - Eventos e Campanhas (Roxo).
- **Novo Evento:** Clique no botão **"+ Novo Evento"** para agendar palestras, reuniões ou ações comunitárias.
- **Listagem:** Use a aba "Lista de Eventos" para ver e gerenciar todos os agendamentos em formato de tabela.

### Data e horário do evento

Os campos **Início** e **Fim** aceitam data **e hora**. Informe o horário real da ação — é ele que aparece no calendário e na listagem.

A coluna **Período** resume as duas datas:

| Situação | Como aparece |
|---|---|
| Mesmo dia, com horário | `20/03/2026 12:00 às 14:00` |
| Mesmo dia, sem horário | `20/03/2026` |
| Vários dias | `10/01/2026 09:00 a 15/01/2026 18:00` |

Quando o horário é meia-noite, ele é omitido — o sistema entende como "horário não informado". Eventos cadastrados antes desta versão ficaram assim; basta editá-los para informar a hora.

### Calendário Visual: legenda e impressão

A aba **Calendário Visual** reúne três origens numa só agenda, cada uma com sua cor:

| Cor | Origem |
| --- | --- |
| 🟣 Roxo | Eventos e campanhas cadastrados aqui |
| 🟢 Verde | Escola da Mulher — início e formatura das turmas |
| 🔵 Azul | Sala Azul — sessões dos grupos reflexivos |

**A legenda é um filtro.** Clique em uma categoria para ocultá-la do calendário e clique de novo para trazê-la de volta. O número ao lado mostra quantos compromissos existem em cada origem. Útil para enxergar só a agenda da Escola, por exemplo.

**Imprimir a agenda** gera um **documento próprio**, não uma foto da tela. A grade do calendário corta os títulos e não mostra local nem descrição; o documento impresso traz:

- Cabeçalho institucional e o mês de referência;
- Um quadro-resumo com a quantidade de compromissos por origem;
- Os compromissos **em ordem cronológica, agrupados por dia**, cada um com horário, origem, título e descrição completa;
- Campos de assinatura para responsável e coordenação.

O documento respeita o mês que está sendo exibido e os filtros da legenda — se você ocultou a Escola, ela não sai no papel (e o documento avisa que há categorias ocultas). Para arquivar em PDF, escolha "Salvar como PDF" na janela de impressão do navegador.

### Encontrar e organizar os eventos (aba Lista)

A aba **Gestão de Eventos (Lista)** mostra os eventos em páginas de 20, com o total à direita. Antes ela exibia apenas os 100 mais recentes — com 171 eventos cadastrados, 71 não apareciam de forma alguma.

**Buscar:** o campo no topo procura por **título ou local**, em toda a base — não só na página aberta.

**Ordenar:** o seletor à direita oferece:

| Ordenação | Quando ajuda |
| --- | --- |
| Data do evento (mais recente) | Padrão — o que acabou de acontecer ou está por vir |
| Data do evento (mais antiga) | Retomar o histórico desde o começo |
| Título (A–Z / Z–A) | Procurar pelo nome quando não se lembra a data |
| Local (A–Z) | Agrupar tudo que aconteceu no mesmo espaço |
| Cadastrados por último | Conferir o que foi incluído recentemente |

**Filtrar** por tipo, categoria e situação (Em Breve, Em Andamento, Encerrado). Os filtros valem sobre a base inteira; quando há algum ativo, aparece o botão **Limpar filtros** com a contagem.

**Exportar CSV** baixa **todos** os eventos do recorte atual — não apenas a página visível —, com título, período, local, categoria, tipo, recorrência, situação e descrição.

> A busca, os filtros e a ordenação ficam no endereço da página. Dá para salvar ou compartilhar o link de uma consulta específica.

### Participantes de um evento

1. Na aba **Lista de Eventos**, localize o evento.
2. Clique no botão **Participantes** (ícone de pessoas) na linha.
3. O quadro mostra o total e a lista de participantes; clique no nome de uma delas para abrir sua ficha.

Para **registrar** uma participação, use a busca por nome ou CPF dentro do quadro, informe a data e confirme. Para remover, use o ícone de lixeira ao lado do nome — isso apaga apenas a participação, nunca o cadastro da beneficiária.

> **Dois caminhos, o mesmo registro.** A participação também pode ser lançada pela ficha da beneficiária, na aba **Eventos**. Use o que for mais prático: pela pessoa quando estiver atendendo, pelo evento quando for lançar a lista de presença de uma ação inteira.

> **Não é possível repetir.** O sistema recusa registrar a mesma beneficiária duas vezes no mesmo evento; quem já está na lista não aparece nas sugestões de busca.

### Equipe de um evento

Registra **quais servidoras e servidores atuaram** no evento — a equipe de trabalho, diferente das participantes atendidas.

1. Na aba **Lista de Eventos**, localize o evento.
2. Clique no botão **Equipe** (ícone de maleta, em roxo) na linha.
3. Escolha a pessoa no campo **Servidora ou servidor** e clique em **Adicionar**.

A lista do campo vem das **contas de usuário do próprio sistema** — as mesmas usadas para entrar no SIGMA. Não há cadastro separado de funcionários: quem tem acesso ao sistema já aparece aqui, pelo nome.

Para tirar alguém da equipe, use o ícone de lixeira ao lado do nome. Isso remove apenas o vínculo com aquele evento — a conta de usuário da pessoa não é afetada.

> **Quem já está na equipe some do campo.** Assim não há como adicionar a mesma pessoa duas vezes. Quando todo mundo já foi incluído, o campo exibe "Todos já estão na equipe".

> **O histórico não se perde.** Se a conta de uma servidora for excluída do Directus mais tarde, os eventos em que ela atuou continuam registrados — a linha aparece como "Usuário removido" em vez de desaparecer.

### Avisos automáticos de escala

Quem entra na equipe **é avisado pelo sistema**. Não é preciso mandar recado à parte.

| Quando acontece | O que a pessoa recebe |
| --- | --- |
| É adicionada à equipe | "Você foi escalada para *evento*", com data e local |
| Véspera do evento, às 8h | "Amanhã: *evento*" |
| É retirada da equipe | "Você não está mais escalada" — e o lembrete da véspera é cancelado |
| O evento muda de data ou local | Toda a equipe é reavisada, com o que mudou |

O aviso de mudança existe por um motivo prático: sem ele, quem foi avisado antes iria no dia ou no lugar errado, **confiando no sistema**.

**Onde os avisos aparecem:** no **sino** ao lado do seu nome, no topo da tela. O número em vermelho indica quantos não foram lidos; clicar no aviso leva ao evento e o marca como lido.

Os mesmos avisos também são enviados por **e-mail institucional**. E por **WhatsApp**, para quem tiver o número cadastrado e tiver autorizado — ver abaixo.

### Receber avisos por WhatsApp (opcional)

O WhatsApp é aparelho pessoal, então o envio **só acontece com sua autorização** — e quem dá ou retira essa autorização é você mesma:

1. Clique no seu **nome** (canto superior direito) e escolha **Meu Perfil**.
2. Abra a aba **Notificações**.
3. Ligue **Receber também por WhatsApp** e informe seu **celular com DDD**.
4. Clique em **Salvar preferências**.

Para deixar de receber, desligue a chave e salve. O sino e o e-mail continuam funcionando de qualquer forma — eles não dependem de configuração.

---

## 7. Marketing e Comunicação

Gestão de campanhas de conscientização e métricas sociais.

1. Acesse o menu **"Marketing e Comunicação"**.
2. Visualize o desempenho de campanhas ativas (Alcance, Engajamento).
3. Cadastre novos materiais ou planeje ações de divulgação vinculadas aos Eventos da Agenda.

---

## 8. Relatórios (RMA e Indicadores)

No menu **Relatórios** ficam os documentos oficiais mensais:

- **RMA (SUAS):** o Relatório Mensal de Atendimentos — movimento do mês, detalhamento por setor e tipos de violência dos novos casos.
- **Indicadores:** painel mensal com identificação, ações, comunicação e perfil demográfico.

Ambos têm filtro de **mês/ano** e duas saídas:

- **Imprimir Relatório:** gera o documento formatado (use "Salvar como PDF" na janela de impressão do navegador para arquivar).
- **Exportar CSV:** baixa os mesmos números em planilha (abre no Excel com acentos corretos), com o nome já padronizado — ex.: `RMA-2026-08.csv`. Elimina a re-digitação ao consolidar dados ou enviar à rede SUAS.

---

## 9. Configurações

Área restrita à gestão para padronizar o sistema. Acessível pelo botão **"Configurações"** no rodapé do menu lateral.

- **Tabelas Auxiliares:** Cadastre novos **Tipos de Evento**, **Bairros**, **Origens de Encaminhamento**, **Tipos de Violência**, etc.
- **Tramitações:** os submenus **Tipos de Tramitação** (tipos de demanda) e **Status de Etapa** definem as opções dos formulários de tramitação e as colunas do Kanban.
- **Acesso & Segurança (admin):** **Permissões de Menu** e **Acesso a Demandas** controlam o que cada perfil enxerga (ver seção 11).
- **Importância:** Qualquer alteração aqui reflete imediatamente nas opções disponíveis nos formulários de cadastro de todo o sistema.

---

## 10. Meu Perfil

Clique no seu **nome** (canto superior direito) e escolha **Meu Perfil**:

- **Dados:** nome, e-mail, perfil de acesso e último acesso.
- **Atividade:** histórico das suas operações no sistema (criações, edições, exclusões) — como a Auditoria, porém apenas as suas.
- **Segurança:** troca de senha. A senha é a mesma do login; é preciso informar a **senha atual** e a nova senha (mínimo de 8 caracteres).

---

## 11. Controle de Acesso (Perfis) — Administradores

O acesso é organizado por **perfil** (o "grupo" do usuário). Cada usuário pertence a um perfil, e o que ele vê depende de duas camadas configuráveis no app.

### Como ativar um perfil para uma equipe

1. **Perfis disponíveis:** o sistema já vem com **Administrator**, **Jurídico**, **Gabinete**, **Atendimento** e **Psicossocial**. Novos perfis são criados no painel do Directus (ou pela equipe de TI).
2. **Acesso aos dados:** todo perfil não-administrador precisa da política **"App Padrão"** vinculada — é ela que libera ver/registrar dados. Os perfis de fábrica já vêm configurados; **um perfil novo precisa receber essa política**, senão o usuário entra mas não vê nada.
3. **Atribuir usuário:** no Directus, em **Usuários**, abra a pessoa, selecione o **Perfil/Função** e salve.
4. **Permissões de Menu:** em **Configurações → Acesso & Segurança → Permissões de Menu**, escolha o perfil e marque os módulos (ou **Acesso total**). Salve.
5. **Acesso a Demandas:** em **Configurações → Acesso & Segurança → Acesso a Demandas**, marque os tipos de demanda que o perfil pode tratar (ex.: Jurídico → "Jurídica"). Salve.

> **Atenção:** um perfil sem a política "App Padrão" deixa o usuário com telas vazias. Vincule-a sempre aos perfis não-administradores. O Dashboard nunca é bloqueável e administradores têm acesso irrestrito.

### O que acontece sem permissão

Quem tenta acessar um módulo fora do seu perfil — por link direto ou URL — vê a página **"Acesso não permitido"**, com o nome do módulo e a orientação de solicitar a liberação à administração. O bloqueio também vale **no servidor**: mesmo chamadas diretas às operações de um módulo não permitido são negadas, não apenas o menu escondido.

Por segurança, o **login** limita tentativas: após **5 senhas erradas** na mesma conta, é preciso aguardar cerca de 15 minutos antes de tentar de novo. O bloqueio é **por conta**, não pela rede — o erro de uma colega não impede as demais de entrar. Se isso acontecer com você, aguarde o tempo indicado na mensagem ou peça à administração a redefinição da sua senha.

---

**Suporte Técnico**
Em caso de dúvidas ou erros no sistema, contate a equipe de TI da Secretaria ou consulte o administrador do sistema.
