# Sistema de Autenticação e Proteção de Rotas

## 📋 Visão Geral

Sistema completo de autenticação implementado com Next.js 14+, Directus e Server Actions, incluindo proteção de rotas via middleware.

---

## 🏗️ Arquitetura

### 1. **Server Actions** (`src/app/login/actions.ts`)

#### Função `login(formData: FormData)`
Gerencia o processo de autenticação:

- **Entrada**: Email e senha via FormData
- **Processo**:
  1. Valida credenciais via Directus SDK (`client.login()`)
  2. Obtém token de acesso (`getToken()`)
  3. Busca dados do usuário (`readMe()`) incluindo role
  4. Armazena em cookies seguros:
     - `session_token` (HTTPOnly, Secure)
     - `user_role` (para controle visual)
     - `user_name` (para exibição no header)
- **Sucesso**: Redireciona para `/admin/dashboard`
- **Erro**: Retorna mensagem amigável

#### Função `logout()`
Destrói a sessão:
- Remove todos os cookies de autenticação
- Redireciona para `/login`

---

### 2. **Página de Login** (`src/app/login/page.tsx`)

#### Design Profissional
- **Layout**: Gradiente suave cinza/slate
- **Card Centralizado**: Shadow-2xl, fundo branco/slate
- **Componentes Shadcn UI**: Input, Label, Button, Card
- **Estados**:
  - Loading durante submissão
  - Feedback visual de erros
  - Animações suaves

#### Funcionalidades
- `useFormState`: Gerencia estado do formulário
- `useFormStatus`: Mostra loading no botão
- Validação automática (required, email type)
- Ícones Lucide React (LogIn, ShieldCheck, AlertCircle)

---

### 3. **Middleware** (`src/middleware.ts`)

#### Regras de Proteção

```typescript
// Rota protegida sem token → Redirecionar para /login
if (pathname.startsWith('/admin') && !sessionToken) {
  redirect('/login?redirect=pathname');
}

// Login com token válido → Redirecionar para /admin/dashboard
if (pathname === '/login' && sessionToken) {
  redirect('/admin/dashboard');
}

// Raiz (/) → Redirecionar baseado em autenticação
if (pathname === '/' && sessionToken) {
  redirect('/admin/dashboard');
} else {
  redirect('/login');
}
```

#### Matcher Config
Intercepta todas as rotas exceto:
- `_next/static` (arquivos estáticos)
- `_next/image` (otimização de imagens)
- `favicon.ico`
- Arquivos públicos
- Rotas de API

---

### 4. **Header com Logout** (`src/components/layout/Header.tsx`)

#### Funcionalidades
- **Dropdown Menu**: Menu do usuário com botão de logout
- **Dados do Cookie**: Exibe nome e role do usuário
- **Tema**: Toggle de dark/light mode
- **Ação de Logout**: Chama server action `logout()`

#### Visual
- Avatar com ícone de usuário
- Nome e role exibidos
- Menu dropdown com separador
- Botão "Sair do Sistema" em vermelho

---

## 🔐 Segurança

### Cookies
| Nome | HTTPOnly | Secure | Função |
|------|----------|--------|--------|
| `session_token` | ✅ Sim | ✅ Prod | Token de autenticação (não acessível via JS) |
| `user_role` | ❌ Não | ✅ Prod | Role do usuário (apenas para UI) |
| `user_name` | ❌ Não | ✅ Prod | Nome do usuário (apenas para exibição) |

### Configurações
- **MaxAge**: 7 dias (604800 segundos)
- **SameSite**: `lax` (proteção CSRF)
- **Path**: `/` (disponível em todo o site)
- **Secure**: Apenas em produção (HTTPS)

---

## 📁 Estrutura de Arquivos

```
src/
├── app/
│   ├── login/
│   │   ├── actions.ts          # Server Actions (login/logout)
│   │   └── page.tsx            # Página de login
│   └── (admin)/                # Rotas protegidas
│       └── dashboard/
├── components/
│   ├── layout/
│   │   └── Header.tsx          # Header com logout
│   └── ui/
│       └── dropdown-menu.tsx   # Componente Shadcn
├── lib/
│   └── directus.ts             # Cliente Directus + getAuthenticatedClient()
└── middleware.ts               # Proteção de rotas
```

---

## 🚀 Como Usar

### 1. Fazer Login
```typescript
// Usuário preenche o formulário em /login
// Server Action valida e cria sessão
// Redireciona automaticamente para /admin/dashboard
```

### 2. Acessar Rotas Protegidas
```typescript
// Todas as rotas /admin/* são automaticamente protegidas
// Middleware verifica cookie session_token
// Sem token → Redireciona para /login
```

### 3. Fazer Logout
```typescript
// Usuário clica em "Sair do Sistema" no header
// Server Action remove cookies
// Redireciona para /login
```

---

## 🧪 Testando

### Cenários de Teste

1. **Login com credenciais válidas**
   - Acesse `/login`
   - Digite email e senha corretos
   - Verifique redirecionamento para `/admin/dashboard`
   - Confirme nome/role no header

2. **Login com credenciais inválidas**
   - Digite email/senha incorretos
   - Verifique mensagem de erro vermelha
   - Confirme que permanece em `/login`

3. **Acesso sem autenticação**
   - Limpe cookies ou use aba anônima
   - Tente acessar `/admin/dashboard`
   - Confirme redirecionamento para `/login`

4. **Logout**
   - Faça login
   - Clique no menu do usuário → "Sair do Sistema"
   - Verifique redirecionamento para `/login`
   - Tente acessar `/admin` novamente

5. **Middleware na raiz**
   - Sem login: Acesse `/` → deve ir para `/login`
   - Com login: Acesse `/` → deve ir para `/admin/dashboard`

---

## 🔧 Configuração do Directus

### Variáveis de Ambiente
```env
NEXT_PUBLIC_DIRECTUS_URL=https://seu-directus.com
DIRECTUS_TOKEN=seu-token-admin-aqui
```

### Permissões Necessárias
- Usuários devem ter campo `role` populado
- Role deve ter propriedade `name` acessível
- Endpoint `/users/me` deve estar disponível

---

## 📦 Dependências

```json
{
  "@directus/sdk": "^17.x",
  "lucide-react": "^0.x",
  "react-dom": "^19.x",
  "@radix-ui/react-dropdown-menu": "^2.x"
}
```

---

## 🎨 Visual

### Tema TailAdmin
- **Cores**: Slate (cinza corporativo)
- **Primary**: Azul profissional
- **Componentes**: Shadcn UI
- **Dark Mode**: Suportado nativamente
- **Animações**: Transições suaves

### Responsividade
- Mobile-first design
- Card centralizado em todas as telas
- Inputs com altura adequada (h-11)
- Padding responsivo (p-4)

---

## 🐛 Troubleshooting

### Problema: "Erro ao obter token"
- Verifique se o Directus está online
- Confirme URL em `NEXT_PUBLIC_DIRECTUS_URL`
- Teste endpoint `/auth/login` manualmente

### Problema: "Usuário não autenticado"
- Cookies podem ter expirado (7 dias)
- Clear cookies e faça login novamente
- Verifique configuração `Secure` em dev (deve ser false)

### Problema: Loop infinito de redirecionamento
- Verifique matcher do middleware
- Confirme que `/login` está na lista de rotas públicas
- Limpe cache do navegador

---

## ✅ Checklist de Implementação

- [x] Server Actions (login/logout)
- [x] Página de login com design profissional
- [x] Middleware de proteção de rotas
- [x] Header com dropdown menu e logout
- [x] Cookies seguros (HTTPOnly, Secure)
- [x] Feedback visual de erros
- [x] Loading states
- [x] Dark mode suportado
- [x] Integração com Directus SDK
- [x] Função getAuthenticatedClient() no directus.ts

---

## 🔜 Melhorias Futuras

1. **Remember Me**: Checkbox para sessão de 30 dias
2. **Recuperação de Senha**: Link "Esqueci minha senha"
3. **2FA**: Autenticação de dois fatores
4. **Refresh Token**: Renovação automática de sessão
5. **Audit Log**: Registro de logins/logouts
6. **Rate Limiting**: Proteção contra brute force
7. **Session Management**: Listar e revogar sessões ativas

---

**Data de Criação**: Janeiro 2026  
**Última Atualização**: Janeiro 2026  
**Versão**: 1.0.0
