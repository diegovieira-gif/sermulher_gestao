#!/bin/bash
# Script de referência para executar testes E2E

# Instalar dependências (primeira vez)
# npm install

# Instalar browsers do Playwright
# npx playwright install

echo "🚀 Iniciando Testes E2E com Playwright"
echo "======================================="
echo ""
echo "Opções disponíveis:"
echo ""
echo "1. Executar TODOS os testes:"
echo "   npx playwright test"
echo ""
echo "2. Executar teste específico:"
echo "   npx playwright test tests/beneficiarias.spec.ts"
echo "   npx playwright test tests/escola.spec.ts"
echo "   npx playwright test tests/sala-azul.spec.ts"
echo "   npx playwright test tests/eventos.spec.ts"
echo ""
echo "3. Executar com navegador visível (headed mode):"
echo "   npx playwright test --headed"
echo ""
echo "4. Modo debug (abre inspetor):"
echo "   npx playwright test --debug"
echo ""
echo "5. Executar teste e ver relatório HTML:"
echo "   npx playwright test && npx playwright show-report"
echo ""
echo "6. Executar com limite de workers (serial):"
echo "   npx playwright test --workers=1"
echo ""
echo "======================================="
echo ""
echo "ℹ️  Pré-requisitos:"
echo "   ✓ Servidor rodando em http://localhost:3000"
echo "   ✓ Banco de dados Directus acessível"
echo "   ✓ Autenticação configurada"
echo ""
echo "📚 Documentação completa em: TESTES_E2E_DOCUMENTACAO.md"
echo ""
