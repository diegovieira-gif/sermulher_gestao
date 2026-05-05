# SerMulher - Sistema de Gestão Integrada

Sistema desenvolvido para a **Secretaria Municipal do Respeito às Políticas para as Mulheres** (Aracaju/SE) para gestão de atendimentos, cursos profissionalizantes e grupos reflexivos.

## 🚀 Módulos

1.  **Gestão de Mulheres:** Prontuário eletrônico, histórico de atendimentos e encaminhamentos.
2.  **Escola:** Gestão de cursos, turmas, matrículas e emissão de **Certificados**.
3.  **Sala Azul:** Acompanhamento de grupos reflexivos para homens (Lei Maria da Penha).
4.  **Eventos:** Agenda institucional integrada.
5.  **Dashboard & Relatórios:** KPIs em tempo real e geração de RMA (Registro Mensal de Atendimentos).

## 🛠️ Tecnologias

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, Shadcn/UI.
- **Backend:** Server Actions.
- **Banco de Dados/CMS:** Directus (PostgreSQL).
- **Relatórios:** React-to-Print (PDFs no navegador).

## ⚙️ Configuração

### Pré-requisitos

- Node.js 18+
- NPM ou Yarn

### Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz:

```bash
# Directus (API & Banco)
DIRECTUS_URL="http://SEU_IP_OU_DOMINIO:8055"
DIRECTUS_TOKEN="seu_token_admin_ou_static_token"
```

### Instalação e Execução

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

## 📄 Estrutura de Pastas

- `/src/app/(admin)`: Rotas protegidas do sistema.
- `/src/components`: Componentes reutilizáveis (UI, Layouts).
- `/src/lib`: Configurações de clientes (Directus, Utils).

## 🤝 Suporte

Desenvolvido para a **Secretaria Municipal do Respeito às Políticas para as Mulheres**.
