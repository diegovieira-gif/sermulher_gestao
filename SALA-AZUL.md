# Módulo Sala Azul - Script de Atualização do Schema

## 📋 Descrição

Script para adicionar o módulo **Sala Azul** ao banco de dados Directus. Este módulo gerencia grupos reflexivos para homens autores de violência, incluindo registro de participantes, frequência e pareceres técnicos.

## 🎯 Objetivo

Expandir o sistema existente com capacidade de:
- Cadastrar homens autores de violência (infratores)
- Organizar grupos reflexivos (salas azul)
- Registrar participação e evolução
- Emitir pareceres psicológicos

## 🚀 Como Usar

### Pré-requisitos
- Schema básico já criado (`npm run setup-schema`)
- Collections **locais** e **directus_users** devem existir

### Executar o script
```bash
npm run update-sala-azul
```

ou

```bash
node update-schema-sala-azul.js
```

## 📊 Collections que serão criadas

### 1. **infratores**
Cadastro de homens autores de violência em acompanhamento.

**Campos:**
- `nome_completo` (string, required) - Nome completo
- `cpf` (string, unique) - CPF único
- `data_nascimento` (date) - Data de nascimento
- `contato` (json) - Telefone, endereço, etc.
- `nivel_periculosidade` (dropdown) - Baixo | Médio | Alto | Crítico
- `tipo_agressao` (multiple select) - Física | Psicológica | Moral | Sexual | Patrimonial
- `numero_processo` (string) - Identificador judicial
- `status_legal` (dropdown) - Em cumprimento | Concluído | Reincidente

### 2. **salas_azul**
Grupos reflexivos organizados em ciclos.

**Campos:**
- `nome_ciclo` (string, required) - Ex: "Ciclo 01/2026 - Manhã"
- `data_inicio` (date) - Data de início
- `data_termino` (date) - Data de término
- `responsavel_tecnico` (M2O -> directus_users) - Profissional responsável
- `local` (M2O -> locais) - Local dos encontros
- `status` (dropdown) - Planejada | Em Andamento | Finalizada

### 3. **participacoes_sala_azul**
Junction table - Registro de participação nos grupos.

**Campos:**
- `infrator` (M2O -> infratores) - Participante
- `sala` (M2O -> salas_azul) - Grupo/ciclo
- `frequencia_percentual` (integer 0-100) - Percentual de presença
- `status_participacao` (dropdown) - Cursando | Concluído com Êxito | Reprovado | Evadido
- `parecer_psicologico` (text, rich) - Avaliação técnica confidencial

## 🔗 Relacionamentos

```
salas_azul
  ├─→ directus_users (responsavel_tecnico)
  └─→ locais (local)

participacoes_sala_azul
  ├─→ infratores (infrator)
  └─→ salas_azul (sala)
```

## 🌱 Dados de Teste Criados

O script automaticamente cria dados de exemplo:

### Sala Azul (1)
- **Nome:** Ciclo 01/2026 - Manhã
- **Status:** Em Andamento
- **Período:** Jan-Jun 2026
- **Local:** Vinculado ao primeiro local existente (ou cria um)

### Infratores (2)

**Infrator 1: João Santos Oliveira**
- Nível: Médio
- Tipo: Física, Psicológica
- Processo: 0001234-56.2025.8.25.0001
- Status: Em cumprimento

**Infrator 2: Carlos Pereira Silva**
- Nível: Baixo
- Tipo: Psicológica
- Processo: 0009876-54.2025.8.25.0001
- Status: Em cumprimento

### Participações (2)
- João com 85% de frequência (Cursando)
- Carlos com 95% de frequência (Cursando)
- Ambos com pareceres psicológicos

## ✅ Recursos

- ✓ Verifica collections existentes (não duplica)
- ✓ Cria campos com validações apropriadas
- ✓ Configura relacionamentos (FKs) automaticamente
- ✓ Reutiliza collections existentes (locais, directus_users)
- ✓ Seed de dados realistas
- ✓ Tratamento de erros robusto
- ✓ Logs detalhados de progresso
- ✓ CPFs gerados automaticamente

## 📝 Estrutura do Script

```
PARTE 1: CRIAÇÃO DO SCHEMA
  ├─ Criar collection 'infratores'
  ├─ Criar collection 'salas_azul'
  │   ├─ Relacionamento com directus_users
  │   └─ Relacionamento com locais
  └─ Criar collection 'participacoes_sala_azul'
      ├─ Relacionamento com infratores
      └─ Relacionamento com salas_azul

PARTE 2: SEED DE DADOS DE TESTE
  ├─ Buscar local e usuário existentes
  ├─ Criar 1 Sala Azul
  ├─ Criar 2 Infratores
  └─ Criar 2 Participações
```

## 🔒 Segurança

**Campo Sensível:**
- `parecer_psicologico` - Marcado como ÁREA RESTRITA
- Contém avaliações técnicas confidenciais
- Configure permissões adequadas no Directus

## 🔧 Troubleshooting

**Erro "Collection 'locais' not found":**
- Execute primeiro: `npm run setup-schema`

**Erro "No users found":**
- O script funciona mesmo sem usuário
- Mas recomenda-se ter ao menos um usuário cadastrado

**Dados duplicados:**
- O script cria novos registros a cada execução
- Para limpar, delete manualmente no Directus Admin

## 💡 Uso Prático

### Fluxo típico de uso:

1. **Cadastrar infrator** quando há determinação judicial
2. **Criar sala azul** para novo ciclo/turma
3. **Vincular participante** à sala via junction table
4. **Atualizar frequência** durante o ciclo
5. **Registrar parecer** ao final do processo
6. **Atualizar status** conforme evolução

### Exemplo de consulta:
```sql
-- Buscar infratores de uma sala específica
SELECT * FROM participacoes_sala_azul 
WHERE sala = <sala_id>
```

## 🌐 Acesso

Após executar o script, acesse:
- **Directus Admin**: http://192.168.0.115:8055/admin/
- Navegue até as collections: infratores, salas_azul, participacoes_sala_azul

## 📚 Conceito: Sala Azul

A **Sala Azul** é uma metodologia de intervenção com homens autores de violência doméstica, baseada em grupos reflexivos que visam:

- Responsabilização pelo ato de violência
- Desconstrução de padrões machistas
- Desenvolvimento de relações não violentas
- Prevenção de reincidência

O módulo implementa o acompanhamento técnico deste processo.
