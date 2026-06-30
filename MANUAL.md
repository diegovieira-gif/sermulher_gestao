# Manual de Operação - Sistema SerMulher

Bem-vindo ao sistema de gestão integrada da **Secretaria Municipal do Respeito às Políticas para as Mulheres**. Este manual guia você pelas principais funcionalidades da plataforma.

---

## 1. Visão Geral (Dashboard)

Ao entrar no sistema, você verá o **Painel de Controle** com indicadores em tempo real:

- **Atendimentos do Mês:** Total de mulheres atendidas no período atual.
- **Mulheres Ativas:** Quantidade de prontuários em acompanhamento contínuo.
- **Eventos:** Agenda dos próximos 7 dias.
- **Pendências:** Casos que aguardam triagem ou ação imediata.

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

Na ficha da beneficiária, as abas **Eventos**, **Cursos** e **Benefícios** registram a participação dela em eventos/campanhas e cursos, além das entregas de benefícios. Clique em **Registrar**, escolha o item, informe a data e uma observação opcional.

### Busca, filtros e telefone validado

- Use os **Filtros** para refinar a lista por **bairro**, ordenação e marcadores (Medida Protetiva, Bolsa Família, BPC); os filtros ativos aparecem como etiquetas removíveis.
- No cadastro, marque **Telefone validado** quando o número for confirmado com a beneficiária.

---

## 3. Escola (Cursos e Oficinas)

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

## 4. Sala Azul (Grupos Reflexivos)

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

## 5. Agenda Institucional (Eventos)

Calendário unificado da Secretaria.

- **Visualização:** O calendário mostra automaticamente:
  - Início e Fim de Turmas (Verde).
  - Sessões da Sala Azul (Azul).
  - Eventos e Campanhas (Roxo).
- **Novo Evento:** Clique no botão **"+ Novo Evento"** para agendar palestras, reuniões ou ações comunitárias.
- **Listagem:** Use a aba "Lista de Eventos" para ver e gerenciar todos os agendamentos em formato de tabela.

---

## 6. Marketing e Comunicação

Gestão de campanhas de conscientização e métricas sociais.

1. Acesse o menu **"Marketing e Comunicação"**.
2. Visualize o desempenho de campanhas ativas (Alcance, Engajamento).
3. Cadastre novos materiais ou planeje ações de divulgação vinculadas aos Eventos da Agenda.

---

## 7. Configurações

Área restrita à gestão para padronizar o sistema. Acessível pelo botão **"Configurações"** no rodapé do menu lateral.

- **Tabelas Auxiliares:** Cadastre novos **Tipos de Evento**, **Bairros**, **Origens de Encaminhamento**, **Tipos de Violência**, etc.
- **Tramitações:** os submenus **Tipos de Tramitação** (tipos de demanda) e **Status de Etapa** definem as opções dos formulários de tramitação e as colunas do Kanban.
- **Acesso & Segurança (admin):** **Permissões de Menu** e **Acesso a Demandas** controlam o que cada perfil enxerga (ver seção 9).
- **Importância:** Qualquer alteração aqui reflete imediatamente nas opções disponíveis nos formulários de cadastro de todo o sistema.

---

## 8. Meu Perfil

Clique no seu **nome** (canto superior direito) e escolha **Meu Perfil**:

- **Dados:** nome, e-mail, perfil de acesso e último acesso.
- **Atividade:** histórico das suas operações no sistema (criações, edições, exclusões) — como a Auditoria, porém apenas as suas.
- **Segurança:** troca de senha. A senha é a mesma do login; é preciso informar a **senha atual** e a nova senha (mínimo de 8 caracteres).

---

## 9. Controle de Acesso (Perfis) — Administradores

O acesso é organizado por **perfil** (o "grupo" do usuário). Cada usuário pertence a um perfil, e o que ele vê depende de duas camadas configuráveis no app.

### Como ativar um perfil para uma equipe

1. **Perfis disponíveis:** o sistema já vem com **Administrator**, **Jurídico**, **Gabinete**, **Atendimento** e **Psicossocial**. Novos perfis são criados no painel do Directus (ou pela equipe de TI).
2. **Acesso aos dados:** todo perfil não-administrador precisa da política **"App Padrão"** vinculada — é ela que libera ver/registrar dados. Os perfis de fábrica já vêm configurados; **um perfil novo precisa receber essa política**, senão o usuário entra mas não vê nada.
3. **Atribuir usuário:** no Directus, em **Usuários**, abra a pessoa, selecione o **Perfil/Função** e salve.
4. **Permissões de Menu:** em **Configurações → Acesso & Segurança → Permissões de Menu**, escolha o perfil e marque os módulos (ou **Acesso total**). Salve.
5. **Acesso a Demandas:** em **Configurações → Acesso & Segurança → Acesso a Demandas**, marque os tipos de demanda que o perfil pode tratar (ex.: Jurídico → "Jurídica"). Salve.

> **Atenção:** um perfil sem a política "App Padrão" deixa o usuário com telas vazias. Vincule-a sempre aos perfis não-administradores. O Dashboard nunca é bloqueável e administradores têm acesso irrestrito.

---

**Suporte Técnico**
Em caso de dúvidas ou erros no sistema, contate a equipe de TI da Secretaria ou consulte o administrador do sistema.
