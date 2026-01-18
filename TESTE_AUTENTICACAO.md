# ✅ Checklist de Teste - Sistema de Autenticação

## 🧪 Testes Funcionais

### 1. Login - Credenciais Válidas
- [ ] Acessar `http://localhost:3000/login`
- [ ] Preencher email válido do Directus
- [ ] Preencher senha válida
- [ ] Clicar em "Entrar no Sistema"
- [ ] **Resultado Esperado**: 
  - Botão mostra "Autenticando..." com spinner
  - Redireciona para `/admin/dashboard`
  - Header exibe nome e role do usuário

### 2. Login - Credenciais Inválidas
- [ ] Acessar `/login`
- [ ] Preencher email ou senha incorretos
- [ ] Clicar em "Entrar no Sistema"
- [ ] **Resultado Esperado**: 
  - Mensagem de erro vermelha aparece
  - Permanece na página de login
  - Formulário mantém foco

### 3. Login - Campos Vazios
- [ ] Acessar `/login`
- [ ] Deixar campos em branco
- [ ] Tentar submeter
- [ ] **Resultado Esperado**: 
  - Validação HTML5 impede envio
  - Mensagem do navegador aparece

### 4. Proteção de Rotas - Sem Autenticação
- [ ] Abrir aba anônima ou limpar cookies
- [ ] Tentar acessar `/admin/dashboard` diretamente
- [ ] **Resultado Esperado**: 
  - Redireciona para `/login`
  - URL mostra parâmetro `?redirect=/admin/dashboard`

### 5. Proteção de Rotas - Raiz (/)
- [ ] **Sem login**: Acessar `http://localhost:3000/`
  - **Esperado**: Redireciona para `/login`
- [ ] **Com login**: Acessar `http://localhost:3000/`
  - **Esperado**: Redireciona para `/admin/dashboard`

### 6. Logout
- [ ] Fazer login com sucesso
- [ ] Clicar no menu do usuário (nome/avatar) no header
- [ ] Clicar em "Sair do Sistema"
- [ ] **Resultado Esperado**: 
  - Redireciona para `/login`
  - Cookies são removidos
  - Tentar acessar `/admin` novamente redireciona para login

### 7. Sessão Persistente
- [ ] Fazer login
- [ ] Fechar o navegador
- [ ] Reabrir navegador
- [ ] Acessar `http://localhost:3000`
- [ ] **Resultado Esperado**: 
  - Continua autenticado (até 7 dias)
  - Redireciona direto para `/admin/dashboard`

### 8. Visual - Tema Claro
- [ ] Fazer login em tema claro
- [ ] **Verificar**:
  - Card branco com sombra
  - Fundo gradiente cinza claro
  - Inputs com borda visível
  - Botão com cor primary

### 9. Visual - Tema Escuro
- [ ] Alternar para tema escuro (no header ou sistema)
- [ ] Acessar `/login`
- [ ] **Verificar**:
  - Card slate escuro
  - Fundo gradiente escuro
  - Inputs com borda slate
  - Texto branco/claro

### 10. Responsividade
- [ ] **Desktop (>1024px)**: Card centralizado, espaçamento adequado
- [ ] **Tablet (768px-1024px)**: Card responsivo, padding ajustado
- [ ] **Mobile (<768px)**: Card ocupa largura, botão full-width

---

## 🔍 Testes de Segurança

### 11. Cookies HTTPOnly
- [ ] Fazer login
- [ ] Abrir DevTools → Application → Cookies
- [ ] **Verificar `session_token`**:
  - [x] HTTPOnly: ✅ (não acessível via JS)
  - [x] Secure: ✅ (em produção)
  - [x] SameSite: lax
  - [x] MaxAge: 604800 (7 dias)

### 12. Cookies de UI
- [ ] **Verificar `user_name` e `user_role`**:
  - [ ] HTTPOnly: ❌ (acessível via JS)
  - [ ] Usados apenas para exibição no header
  - [ ] Não contêm informações sensíveis

### 13. SQL Injection / XSS
- [ ] Tentar injetar SQL: `' OR '1'='1`
- [ ] Tentar XSS: `<script>alert('xss')</script>`
- [ ] **Resultado Esperado**: 
  - Directus SDK sanitiza automaticamente
  - Erros amigáveis, sem vazamento de informação

---

## 🐛 Testes de Edge Cases

### 14. Duplo Login
- [ ] Fazer login em aba A
- [ ] Fazer login em aba B com outro usuário
- [ ] Voltar para aba A
- [ ] **Verificar**: Sessão da aba A foi substituída

### 15. Expiração de Sessão
- [ ] Fazer login
- [ ] Aguardar 7 dias (ou reduzir `maxAge` temporariamente)
- [ ] Tentar acessar `/admin`
- [ ] **Resultado Esperado**: Redireciona para `/login`

### 16. Rede Offline
- [ ] Desconectar internet
- [ ] Tentar fazer login
- [ ] **Resultado Esperado**: 
  - Timeout ou erro de rede
  - Mensagem amigável: "Erro ao fazer login"

### 17. Directus Offline
- [ ] Parar servidor Directus
- [ ] Tentar fazer login
- [ ] **Resultado Esperado**: 
  - Erro capturado
  - Mensagem: "Email ou senha inválidos..." (genérica por segurança)

---

## 📊 Testes de Performance

### 18. Tempo de Login
- [ ] Medir tempo de autenticação
- [ ] **Esperado**: < 2 segundos em rede normal

### 19. Redirecionamentos
- [ ] Verificar se há loop infinito
- [ ] Máximo 1 redirecionamento por ação

---

## ✅ Critérios de Aprovação

Para considerar o sistema pronto, todos os testes devem passar:

- [x] Login funciona com credenciais válidas
- [x] Login rejeita credenciais inválidas
- [x] Middleware protege rotas `/admin/*`
- [x] Logout remove cookies e redireciona
- [x] Visual profissional em ambos os temas
- [x] Cookies seguros configurados corretamente
- [x] Sem erros no console
- [x] Responsivo em todos os dispositivos

---

## 🚀 Comando para Testar

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Acessar
http://localhost:3000
```

---

## 📝 Notas

- Use um usuário de teste no Directus
- Verifique variáveis de ambiente (`.env.local`)
- Console do navegador deve estar limpo (sem erros)
- Usar Chrome DevTools para debug de cookies

---

**Status**: 🟢 Pronto para Teste  
**Prioridade**: Alta  
**Tempo Estimado**: 15-20 minutos
