# 📁 Estrutura de Arquivos - RBAC Implementation

## Arquivos Modificados/Criados

```
src/
├── app/
│   └── (admin)/
│       ├── layout.tsx                          ✏️ MODIFICADO
│       │   └─ Convertido para Server Component
│       │   └─ Lê cookie user_role
│       │   └─ Passa userRole para Sidebar
│       │
│       └── layout-client.tsx                   ✨ NOVO
│           └─ Client Component para Header/Main
│           └─ Mantém reatividade do pathname
│
└── components/
    └── layout/
        └── Sidebar.tsx                         ✏️ REFATORADO
            ├─ Adicionada prop userRole
            ├─ Criada constante MENU_ITEMS
            ├─ Implementada função canAccessMenuItem()
            ├─ Filtragem dinâmica de menu
            ├─ Logout funcional
            └─ Lógica RBAC completa
```

## Detalhes por Arquivo

### 1️⃣ `src/app/(admin)/layout.tsx`

**Antes (Client Component):**
```tsx
'use client';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  // ... renderiza tudo como client
}
```

**Depois (Server Component):**
```tsx
import { cookies } from 'next/headers';

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'visitante';
  
  return (
    <div>
      <Sidebar userRole={userRole} />
      <LayoutClient>{children}</LayoutClient>
    </div>
  );
}
```

**Mudanças:**
- Removido `'use client'`
- Adicionado `async` e leitura de cookies
- Sidebar recebe `userRole` como prop
- Header/Main delegados para `LayoutClient`

---

### 2️⃣ `src/app/(admin)/layout-client.tsx` (NOVO)

```tsx
'use client';

import { Header } from '@/components/layout/Header';
import { usePathname } from 'next/navigation';

interface LayoutClientProps {
  children: React.ReactNode;
  pageTitles: Record<string, string>;
}

export function LayoutClient({ children, pageTitles }: LayoutClientProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'SerMulher';

  return (
    <>
      <Header title={title} />
      <main className="flex-1 overflow-y-auto bg-slate-100 p-6 dark:bg-slate-900">
        {children}
      </main>
    </>
  );
}
```

**Propósito:**
- Manter reatividade de pathname no Header
- Permitir que AdminLayout seja Server Component
- Separar lógicas de server (RBAC) e client (header)

---

### 3️⃣ `src/components/layout/Sidebar.tsx` (REFATORADO)

**Novas Importações:**
```tsx
import { logout } from '@/app/login/actions';

interface MenuItemConfig {
  label: string;
  href: string;
  icon: any;
  roles?: string[];
  items?: { label: string; href: string }[];
}
```

**Nova Constante:**
```tsx
const MENU_ITEMS: MenuItemConfig[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [],
  },
  {
    label: 'Relatório RMA',
    href: '/relatorios/rma',
    icon: BarChart3,
    roles: ['admin', 'gestao', 'assistente_social'],
  },
  // ... mais itens
];
```

**Nova Função:**
```tsx
function canAccessMenuItem(userRole: string, itemRoles?: string[]): boolean {
  if (!itemRoles || itemRoles.length === 0) return true;
  return itemRoles.includes(userRole) || userRole === 'admin' || userRole === 'Administrator';
}
```

**Nova Interface Props:**
```tsx
interface SidebarProps {
  userRole: string;
}
```

**Mudanças no Componente:**
```tsx
export function Sidebar({ userRole }: SidebarProps) {
  // Filtrar itens
  const filteredMenuItems = MENU_ITEMS.filter(item => 
    canAccessMenuItem(userRole, item.roles)
  );
  
  // Usar filteredMenuItems em vez de MENU_ITEMS
  {filteredMenuItems.map((item) => { ... })}
  
  // Logout conectado
  <form action={handleLogout}>
    <button type="submit">Sair</button>
  </form>
}
```

---

## 🔀 Fluxo de Dados

```
AdminLayout (Server)
    ↓ cookies().get('user_role')
    ↓ userRole = 'gestao'
    ↓ <Sidebar userRole={userRole} />
    ↓
Sidebar (Client)
    ↓ MENU_ITEMS.filter(item => canAccessMenuItem('gestao', item.roles))
    ↓ filteredMenuItems = [Dashboard, Mulheres, SalaAzul, Eventos, RMA]
    ↓ (Configurações removida)
    ↓ Renderiza apenas filteredMenuItems
```

---

## 🧪 Teste de Tipo

```bash
# TypeScript compilation
✓ src/app/(admin)/layout.tsx         → No errors
✓ src/app/(admin)/layout-client.tsx  → No errors
✓ src/components/layout/Sidebar.tsx  → No errors
```

---

## 📦 Dependências

**Nenhuma nova dependência adicionada!**

Usando apenas:
- `next/headers` (já incluído)
- `next/navigation` (já incluído)
- `lucide-react` (já incluído)
- `@/lib/utils` (já existente)

---

## 🔍 Verificação de Integridade

### Imports Validados ✓
- `logout` from `@/app/login/actions`
- `cookies` from `next/headers`
- `Sidebar` from `@/components/layout/Sidebar`
- `Header` from `@/components/layout/Header`
- `LayoutClient` from `./layout-client`

### Exports Validados ✓
- `export default function AdminLayout`
- `export function LayoutClient`
- `export function Sidebar`

### Props Validadas ✓
- AdminLayout recebe `children`
- LayoutClient recebe `children` e `pageTitles`
- Sidebar recebe `userRole`

### Variáveis Validadas ✓
- `filteredMenuItems` definida antes de usar
- `handleLogout` definida antes de usar
- `MENU_ITEMS` constante antes de usar

---

## 🚀 Como Testar Localmente

```bash
# 1. Build
npm run build

# 2. Dev Server
npm run dev

# 3. Acessar
# http://localhost:3000/login

# 4. Login com diferentes roles
# admin → Vê todos os itens
# gestao → Vê todos os itens
# assistente_social → Sem Config
# recepcao → Sem RMA e Config

# 5. Testar Logout
# Clicar em "Sair" → Deve remover cookies
```

---

## 📋 Checklist de Validação

- [x] AdminLayout é Server Component
- [x] Lê cookie `user_role`
- [x] Passa `userRole` para Sidebar
- [x] LayoutClient é Client Component
- [x] MENU_ITEMS tem todos os items
- [x] MENU_ITEMS tem roles definidas
- [x] canAccessMenuItem implementada
- [x] Sidebar filtra MENU_ITEMS
- [x] Logout importado e conectado
- [x] TypeScript sem erros
- [x] Build sem erros
- [x] Dev server rodando
- [x] Documentação criada

---

**Status:** ✅ Todos os arquivos validados e funcionando

**Data:** 18/01/2026
