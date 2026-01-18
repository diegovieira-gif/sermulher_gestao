# 🧪 Guia de Teste - RBAC na Sidebar

## ✅ Checklist de Funcionalidades

### 1. Leitura de Cookie user_role
- [ ] Verificar no DevTools (Aplicação → Cookies) que `user_role` existe após login
- [ ] Confirmar valor correto conforme Directus role

### 2. Filtro de Menu por Role

#### 🟢 Admin / Gestor
- [ ] Dashboard (visível)
- [ ] Gestão de Mulheres (visível)
  - [ ] Indicadores (submenu)
  - [ ] Beneficiárias (submenu)
  - [ ] Atendimentos (submenu)
- [ ] Sala Azul (visível)
- [ ] Agenda & Eventos (visível)
- [ ] Relatório RMA (visível) ✓
- [ ] Configurações (visível) ✓

#### 🟠 Assistente Social
- [ ] Dashboard (visível)
- [ ] Gestão de Mulheres (visível)
- [ ] Sala Azul (visível)
- [ ] Agenda & Eventos (visível)
- [ ] Relatório RMA (visível) ✓
- [ ] Configurações (OCULTO) ✗

#### 🔵 Recepção / Psicologia / Jurídico
- [ ] Dashboard (visível)
- [ ] Gestão de Mulheres (visível)
- [ ] Sala Azul (visível)
- [ ] Agenda & Eventos (visível)
- [ ] Relatório RMA (OCULTO) ✗
- [ ] Configurações (OCULTO) ✗

#### ⚫ Visitante (padrão)
- [ ] Dashboard (visível)
- [ ] Gestão de Mulheres (visível)
- [ ] Sala Azul (visível)
- [ ] Agenda & Eventos (visível)
- [ ] Relatório RMA (OCULTO) ✗
- [ ] Configurações (OCULTO) ✗

### 3. Funcionalidade de Logout
- [ ] Botão "Sair" está visível na Sidebar
- [ ] Clicar em "Sair" remove cookies
- [ ] Página redireciona para `/login`
- [ ] Todos os cookies removidos:
  - [ ] `session_token` (removido)
  - [ ] `user_role` (removido)
  - [ ] `user_name` (removido)

### 4. Navegação Ativa
- [ ] Item ativo tem background azul e borda esquerda
- [ ] Submenu se expande/recolhe corretamente
- [ ] Ícones aparecem com tamanho correto
- [ ] Cores de hover funcionam

### 5. Responsividade Dark Mode
- [ ] Cores escuras mantidas (TailAdmin theme)
- [ ] Sidebar tem fundo slate-900
- [ ] Texto em slate-300
- [ ] Itens ativos com border-blue-500

## 🔍 Teste Manual no DevTools

### Network Tab (ao fazer logout)
```
DELETE /api/logout
Response Status: 200
Set-Cookie: session_token=; Max-Age=0
Set-Cookie: user_role=; Max-Age=0
Set-Cookie: user_name=; Max-Age=0
```

### Console Tab
- Não deve haver erros relacionados a `filteredMenuItems` ou `handleLogout`
- Verificar mensagens de warning (deprecation middleware é esperado)

## 🚀 Cenários de Teste

### Cenário 1: Login como Admin
```
1. Ir para /login
2. Entrar com credenciais de admin
3. Verificar que todos os menus aparecem
4. Clicar em cada submenu
5. Verificar Logout funciona
```

### Cenário 2: Login como Recepção
```
1. Ir para /login
2. Entrar com credenciais de recepção
3. Verificar que Relatório RMA está OCULTO
4. Verificar que Configurações está OCULTO
5. Verificar que Dashboard, Mulheres, Sala Azul, Eventos aparecem
```

### Cenário 3: Acesso Direto via URL (Segurança)
```
1. Login como Recepção
2. Tentar acessar /configuracoes diretamente
   → Deve carregar, mas item não aparece na Sidebar
   → Implemente proteção no servidor se necessário
3. Tentar acessar /relatorios/rma diretamente
   → Deve carregar, mas item não aparece na Sidebar
```

## 📊 Componentes Envolvidos

```
AdminLayout (Server)
  ├── Lê cookie user_role
  ├── Passa para Sidebar
  └── Renderiza LayoutClient
      ├── Sidebar (Client) - Filtra menu
      └── LayoutClient (Client)
          ├── Header
          └── Main Content
```

## 🛠️ Troubleshooting

| Problema | Solução |
|----------|---------|
| Menu não filtra | Verificar se cookie `user_role` existe e tem valor correto |
| Logout não funciona | Verificar se `logout()` foi importado corretamente |
| Submenu não abre | Limpar cache e hard refresh (Ctrl+Shift+R) |
| Cores erradas | Verificar tema dark mode está ativado |
| Erros no console | Verificar se Sidebar recebe `userRole` como string |

---

**Última atualização:** 18/01/2026
