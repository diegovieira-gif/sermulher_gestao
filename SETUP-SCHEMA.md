# Script de Configuração do Schema Directus

## 📋 Descrição

Script Node.js para criar automaticamente toda a estrutura de banco de dados no Directus, incluindo:

- 8 collections principais
- Campos com validações e interfaces apropriadas
- Relacionamentos Many-to-One (M2O)
- Dropdowns com valores pré-definidos

## 🚀 Como Usar

### 1. Instalar dependências (já instalado)
```bash
npm install @directus/sdk
```

### 2. Configurar o token
Abra o arquivo `setup-schema.js` e substitua o valor de `ADMIN_TOKEN` pelo seu token de administrador do Directus:

```javascript
const ADMIN_TOKEN = 'SEU_TOKEN_AQUI';
```

**Como obter o token:**
1. Acesse o Directus Admin (http://192.168.0.115:8055)
2. Vá em Settings > Access Tokens
3. Crie um novo token estático com permissões de Admin
4. Copie e cole no script

### 3. Executar o script
```bash
npm run setup-schema
```

ou

```bash
node setup-schema.js
```

## 📊 Collections que serão criadas

1. **beneficiarias** - Dados das beneficiárias
   - nome_completo, cpf (único), data_nascimento
   - contato (JSON), endereco (JSON)
   - perfil_socioeconomico, tags

2. **locais** - Locais de atendimento
   - nome, endereco, capacidade
   - tipo (dropdown: CRAS, Escola, Centro Comunitário, Auditório)

3. **setores** - Setores da organização
   - nome (Recepção, Jurídico, Psicológico, etc.)

4. **atendimentos** - Fluxo macro de atendimentos
   - status, origem, prioridade
   - beneficiaria (FK -> beneficiarias)
   - data_abertura

5. **tramitacoes** - Histórico detalhado
   - atendimento_pai (FK -> atendimentos)
   - setor_responsavel (FK -> setores)
   - usuario_responsavel (FK -> directus_users)
   - tipo_demanda, relato_tecnico, status_etapa
   - datas de recebimento e conclusão

6. **eventos_campanhas** - Eventos e campanhas
   - nome, tipo, datas, descrição

7. **turmas_sessoes** - Turmas de eventos
   - evento_pai (FK -> eventos_campanhas)
   - local (FK -> locais)
   - nome_identificador, vagas

8. **inscricoes_participacoes** - Inscrições
   - beneficiaria (FK -> beneficiarias)
   - turma_sessao (FK -> turmas_sessoes)
   - presenca, certificado_emitido

## ✅ Recursos

- ✓ Verificação de collections existentes (não duplica)
- ✓ Tratamento de erros robusto
- ✓ Criação sequencial respeitando dependências
- ✓ Relacionamentos M2O corretamente configurados
- ✓ Interfaces apropriadas (dropdowns, dates, JSON, rich text)
- ✓ Campos com validações (required, unique)
- ✓ Logs detalhados de progresso

## 🔧 Troubleshooting

**Erro de autenticação:**
- Verifique se o token está correto
- Confirme que o token tem permissões de Admin

**Collection já existe:**
- O script pula automaticamente collections existentes
- Não há problema em executar múltiplas vezes

**Erro de relacionamento:**
- Certifique-se de que as collections base foram criadas primeiro
- O script já executa na ordem correta

## 📝 Notas

- O script usa a API REST do Directus diretamente via fetch
- Todos os relacionamentos são do tipo Many-to-One (M2O)
- Os campos de sistema (id, date_created, user_created) são criados automaticamente
- É seguro executar o script múltiplas vezes
