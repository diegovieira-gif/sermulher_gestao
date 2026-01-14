# Script de Seed de Dados - Directus

## 📋 Descrição

Script Node.js para popular o banco de dados Directus com dados de teste realistas simulando o cenário de uso real da aplicação.

## 🎯 Cenário de Teste

O script cria um cenário completo com:

- **Maria da Silva** - Beneficiária que utiliza os serviços
- **2 Locais** - Onde acontecem os eventos
- **2 Eventos** - Campanha e Curso
- **2 Turmas** - Sessões dos eventos
- **2 Inscrições** - Maria participando dos eventos
- **Dados extras** - Setores, atendimento e tramitação

## 🚀 Como Usar

### 1. Certifique-se de que o schema foi criado
```bash
npm run setup-schema
```

### 2. Execute o seed
```bash
npm run seed-data
```

ou

```bash
node seed-data.js
```

## 📊 Dados que serão criados

### 1. Locais (2)
- **Centro Comunitário Norte**
  - Endereço: Rua das Flores, 123
  - Capacidade: 80 pessoas
  - Tipo: Centro Comunitário

- **Auditório Central**
  - Endereço: Avenida Principal, 456
  - Capacidade: 200 pessoas
  - Tipo: Auditório

### 2. Eventos/Campanhas (2)
- **Outubro Rosa 2024**
  - Tipo: Campanha
  - Período: Outubro 2024
  - Descrição: Conscientização sobre câncer de mama

- **Informática para o Trabalho**
  - Tipo: Curso
  - Período: Fev-Mar 2024
  - Descrição: Curso profissionalizante

### 3. Turmas/Sessões (2)
- **Dia D - Palestra Saúde**
  - Vinculada ao Outubro Rosa
  - Local: Auditório Central
  - Vagas: 150

- **Turma Matutina A**
  - Vinculada ao Curso de Informática
  - Local: Centro Comunitário Norte
  - Vagas: 25

### 4. Beneficiária (1)
- **Maria da Silva**
  - CPF: Gerado automaticamente (formato válido)
  - Data de Nascimento: 15/05/1985
  - Contato:
    ```json
    {
      "telefone": "79999999999",
      "email": "maria.teste@email.com",
      "whatsapp": "79999999999"
    }
    ```
  - Endereço:
    ```json
    {
      "rua": "Rua das Acácias, 789",
      "bairro": "Bairro São José",
      "cidade": "Aracaju",
      "estado": "SE",
      "cep": "49000-000"
    }
    ```
  - Tags: `["Prioridade", "Mãe Solo"]`
  - Perfil: Mãe solo, 2 filhos, desempregada

### 5. Inscrições/Participações (2)
- Maria inscrita no Outubro Rosa (Presente ✓)
- Maria inscrita no Curso de Informática (Presente ✓, Certificado ✗)

### 6. Dados Complementares
- **3 Setores**: Recepção, Jurídico, Psicológico
- **1 Atendimento**: Para Maria, status "Em andamento"
- **1 Tramitação**: Setor Psicológico, tipo "Terapia"

## ✅ Recursos

- ✓ Criação sequencial respeitando dependências (FK)
- ✓ Logs detalhados de cada item criado
- ✓ Salva IDs automaticamente para relacionamentos
- ✓ Tratamento de erros robusto
- ✓ CPF fictício gerado automaticamente
- ✓ Dados JSON estruturados (contato, endereço)
- ✓ Resumo completo ao final
- ✓ Pode ser executado múltiplas vezes (cria novos registros)

## 🔧 Ordem de Criação

O script segue esta ordem para garantir que os relacionamentos funcionem:

```
1. Locais          (sem dependências)
2. Eventos         (sem dependências)
3. Turmas          (depende de: eventos, locais)
4. Beneficiária    (sem dependências)
5. Inscrições      (depende de: beneficiária, turmas)
6. Setores         (complementar)
7. Atendimento     (depende de: beneficiária, setores)
```

## 📝 Exemplo de Saída

```
🌱 Iniciando seed de dados de teste no Directus
📍 URL: http://192.168.0.115:8055
⏳ Aguarde...

📍 Criando Locais...
  ✅ Local criado: ID 1 - Centro Comunitário Norte
  ✅ Local criado: ID 2 - Auditório Central

🎉 Criando Eventos/Campanhas...
  ✅ Evento criado: ID 1 - Outubro Rosa 2024
  ✅ Evento criado: ID 2 - Informática para o Trabalho

🎓 Criando Turmas/Sessões...
  ✅ Turma criada: ID 1 - Dia D - Palestra Saúde
  ✅ Turma criada: ID 2 - Turma Matutina A

👤 Criando Beneficiária...
  ✅ Beneficiária criada: ID 1 - Maria da Silva (CPF: 123.456.789-01)

📝 Criando Inscrições/Participações...
  ✅ Inscrição criada: ID 1 - Maria na Palestra de Saúde (Presença: ✓)
  ✅ Inscrição criada: ID 2 - Maria no Curso de Informática (Presença: ✓, Certificado: ✗)

✅ SEED CONCLUÍDO COM SUCESSO!
```

## 🔧 Troubleshooting

**Erro "Collection not found":**
- Execute primeiro: `npm run setup-schema`
- Certifique-se que todas as collections foram criadas

**Erro de relacionamento:**
- Verifique se os IDs estão sendo salvos corretamente
- O script já trata isso automaticamente

**Dados duplicados:**
- O script cria novos registros a cada execução
- Para limpar, delete manualmente no Directus Admin

## 💡 Dicas

- Execute o seed após criar o schema
- Pode executar múltiplas vezes para criar mais beneficiárias
- Modifique os dados diretamente no código para outros cenários
- Use os IDs criados para testes manuais

## 🌐 Acesso

Após executar o seed, acesse:
- **Directus Admin**: http://192.168.0.115:8055/admin/
- **API de Teste**: http://localhost:3000/api/test-directus
