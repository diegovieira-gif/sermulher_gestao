# Guia Manual: Criação da Collection config_encaminhamentos no Directus

Como o token não possui permissões para criar collections via API, siga este guia para criar manualmente no Directus Admin.

## ⚙️ Passos para Criar a Collection

### 1. Acesse o Directus Admin
- URL: http://192.168.0.115:8055
- Faça login com suas credenciais de administrador

### 2. Crie a Nova Collection

1. No menu lateral, clique em **Settings** (Configurações)
2. Clique em **Data Model**
3. Clique no botão **Create Collection** (+ no canto superior direito)

### 3. Configure a Collection

**Dados Básicos:**
- **Collection Name:** `config_encaminhamentos`
- **Icon:** `arrow_forward` (ou escolha um ícone de sua preferência)
- **Note:** Tipos de Encaminhamentos para RMA
- **Display Template:** `{{nome}}`
- Deixe desmarcado "Singleton"

### 4. Adicione os Campos

#### Campo 1: `nome` (Nome do Encaminhamento)
- **Field Name:** `nome`
- **Type:** String
- **Interface:** Input
- **Required:** ✅ Sim
- **Note:** Nome do encaminhamento

#### Campo 2: `grupo_rma` (Grupo RMA)
- **Field Name:** `grupo_rma`
- **Type:** String
- **Interface:** Dropdown
- **Required:** ❌ Não
- **Note:** Grupo RMA para classificação no relatório

**Choices (Opções do Dropdown):**
```
Text: Assistência Social | Value: assistencia_social
Text: Saúde              | Value: saude
Text: Justiça            | Value: justica
Text: Educação           | Value: educacao
Text: Outros             | Value: outros
```

### 5. Configure Permissões

1. Vá em **Settings** > **Roles & Permissions**
2. Selecione a role que você está usando (provavelmente "Administrator" ou a role do seu token)
3. Encontre a collection `config_encaminhamentos`
4. Habilite as permissões: **Create**, **Read**, **Update**, **Delete**

### 6. Adicione Dados de Exemplo

Após criar a collection, adicione alguns registros de teste:

1. Acesse a collection `config_encaminhamentos` no menu lateral
2. Clique em **Create Item**
3. Adicione exemplos:

```
Nome: CRAS                  | Grupo: assistencia_social
Nome: CREAS                 | Grupo: assistencia_social
Nome: Centro de Saúde       | Grupo: saude
Nome: Hospital              | Grupo: saude
Nome: Delegacia da Mulher   | Grupo: justica
Nome: Fórum                 | Grupo: justica
Nome: Escola                | Grupo: educacao
Nome: ONG                   | Grupo: outros
```

## 🗑️ Remover Collection Antiga (Opcional)

Se existir uma collection chamada `config_tipos_violencia`, você pode removê-la:

1. Vá em **Settings** > **Data Model**
2. Encontre `config_tipos_violencia`
3. Clique nos três pontos (...) > **Delete**
4. Confirme a remoção

**Nota:** Usamos `config_tipos_agressao` no lugar de `config_tipos_violencia`.

## ✅ Teste no Frontend

Após criar a collection e adicionar dados:

1. Inicie o servidor de desenvolvimento: `npm run dev`
2. Acesse: http://localhost:3000/configuracoes
3. Clique na aba **Encaminhamentos**
4. Você deve ver os registros criados
5. Teste criar, editar e deletar encaminhamentos

## 🔧 Testando no Formulário de Atendimento

1. Acesse: http://localhost:3000/mulheres/atendimentos
2. Clique em **Novo Atendimento**
3. No campo **Encaminhamento (config)**, você deve ver os encaminhamentos criados
4. No campo **Tipos de Violência**, você deve ver os tipos de `config_tipos_agressao`

## 📝 Notas Importantes

- O frontend já está configurado para usar `config_encaminhamentos`
- O mapeamento em `actions.ts` já está correto
- A página de configurações já tem a aba "Encaminhamentos"
- O formulário de atendimento já está preparado para receber dados dinâmicos

## 🚨 Troubleshooting

### Erro: "Erro ao buscar dados"
- Verifique se as permissões estão corretas
- Verifique se o token tem acesso à collection

### Encaminhamentos não aparecem no formulário
- Verifique se há registros na collection
- Verifique o console do navegador para erros de API
- Verifique se o servidor está rodando

### Campo grupo_rma não mostra o dropdown
- Certifique-se de criar o campo como "Dropdown" interface
- Adicione as choices corretas conforme o guia
