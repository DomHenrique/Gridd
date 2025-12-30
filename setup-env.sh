#!/bin/bash

# ============================================================================
# Script de Setup de Variáveis de Ambiente - Gridd360
# Uso: chmod +x setup-env.sh && ./setup-env.sh
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║    Setup de Variáveis de Ambiente - Gridd360 Asset Manager    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# 1. Verificar se .env.local já existe
# ============================================================================

if [ -f ".env.local" ]; then
  echo -e "${YELLOW}⚠️  Arquivo .env.local já existe${NC}"
  read -p "Deseja sobrescrever? (s/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada${NC}"
    exit 0
  fi
fi

# ============================================================================
# 2. Criar .env.local a partir de .env.example
# ============================================================================

echo -e "${BLUE}📋 Copiando .env.example para .env.local...${NC}"
cp .env.example .env.local
echo -e "${GREEN}✅ Arquivo criado${NC}"
echo ""

# ============================================================================
# 3. Gerar SESSION_SECRET seguro
# ============================================================================

echo -e "${BLUE}🔐 Gerando SESSION_SECRET seguro...${NC}"
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
echo -e "${GREEN}✅ Chave gerada: ${SESSION_SECRET:0:20}...${NC}"
echo ""

# Atualizar .env.local
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/sua-chave-secreta-muito-segura-mudeme-em-producao/$SESSION_SECRET/" .env.local
else
  # Linux
  sed -i "s/sua-chave-secreta-muito-segura-mudeme-em-producao/$SESSION_SECRET/" .env.local
fi

# ============================================================================
# 4. Solicitar configurações essenciais
# ============================================================================

echo -e "${BLUE}📝 Configurando variáveis obrigatórias${NC}"
echo ""

# Google Client ID
read -p "Google OAuth Client ID (obtém em console.cloud.google.com): " GOOGLE_CLIENT_ID

if [ -z "$GOOGLE_CLIENT_ID" ]; then
  echo -e "${YELLOW}⚠️  Google Client ID não fornecido${NC}"
  echo "  Você pode configurar depois editando .env.local"
else
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/614423855338-uiuvaaesjj3qcqi1d9k8t6ivhlm4nbne.apps.googleusercontent.com/$GOOGLE_CLIENT_ID/" .env.local
  else
    sed -i "s/614423855338-uiuvaaesjj3qcqi1d9k8t6ivhlm4nbne.apps.googleusercontent.com/$GOOGLE_CLIENT_ID/" .env.local
  fi
  echo -e "${GREEN}✅ Google Client ID configurado${NC}"
fi
echo ""

# API URL
read -p "URL da API (deixe em branco para http://localhost:3001/api): " API_URL
if [ -z "$API_URL" ]; then
  API_URL="http://localhost:3001/api"
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|http://localhost:3001/api|$API_URL|g" .env.local
else
  sed -i "s|http://localhost:3001/api|$API_URL|g" .env.local
fi
echo -e "${GREEN}✅ API URL configurada: $API_URL${NC}"
echo ""

# Debug Mode
read -p "Ativar Debug Mode? (s/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/REACT_APP_DEBUG=false/REACT_APP_DEBUG=true/" .env.local
  else
    sed -i "s/REACT_APP_DEBUG=false/REACT_APP_DEBUG=true/" .env.local
  fi
  echo -e "${GREEN}✅ Debug Mode ativado${NC}"
else
  echo -e "${GREEN}✅ Debug Mode desativado${NC}"
fi
echo ""

# ============================================================================
# 5. Validar configuração
# ============================================================================

echo -e "${BLUE}✓ Validando configuração...${NC}"

# Verificar se arquivo foi criado
if [ -f ".env.local" ]; then
  echo -e "${GREEN}✅ Arquivo .env.local criado${NC}"
else
  echo -e "${RED}❌ Erro ao criar .env.local${NC}"
  exit 1
fi

# Verificar se contains Google Client ID
if grep -q "apps.googleusercontent.com" .env.local; then
  echo -e "${GREEN}✅ Google OAuth configurado${NC}"
else
  echo -e "${YELLOW}⚠️  Google OAuth não configurado${NC}"
fi

# Verificar SESSION_SECRET
if grep -q "mudeme-em-producao" .env.local; then
  echo -e "${YELLOW}⚠️  SESSION_SECRET ainda é padrão${NC}"
else
  echo -e "${GREEN}✅ SESSION_SECRET configurado${NC}"
fi

echo ""

# ============================================================================
# 6. Adicionar .env.local ao .gitignore
# ============================================================================

if [ -f ".gitignore" ]; then
  if grep -q ".env.local" .gitignore; then
    echo -e "${GREEN}✅ .env.local já está em .gitignore${NC}"
  else
    echo ".env.local" >> .gitignore
    echo -e "${GREEN}✅ .env.local adicionado ao .gitignore${NC}"
  fi
else
  echo ".env.local" > .gitignore
  echo -e "${GREEN}✅ .gitignore criado com .env.local${NC}"
fi

echo ""

# ============================================================================
# 7. Mostrar resumo
# ============================================================================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Setup Concluído! ✅                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Próximos passos:${NC}"
echo ""
echo "1. Verifique o arquivo .env.local:"
echo -e "   ${BLUE}cat .env.local${NC}"
echo ""
echo "2. Se precisar editar variáveis:"
echo -e "   ${BLUE}nano .env.local${NC}"
echo ""
echo "3. Inicie o servidor de desenvolvimento:"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "4. Consulte a documentação:"
echo -e "   ${BLUE}docs/ENV_VARIABLES.md${NC}"
echo ""

# Mostrar resumo rápido
echo -e "${YELLOW}Resumo da Configuração:${NC}"
echo "  • Ambiente: DEVELOPMENT"
echo "  • API URL: $API_URL"
if grep -q "true" .env.local | grep "REACT_APP_DEBUG"; then
  echo "  • Debug: ✅ Ativado"
else
  echo "  • Debug: ❌ Desativado"
fi
if grep -q "apps.googleusercontent.com" .env.local; then
  echo "  • Google OAuth: ✅ Configurado"
else
  echo "  • Google OAuth: ⚠️  Não configurado"
fi
echo ""
echo -e "${GREEN}Tudo pronto! Execute ${BLUE}npm run dev${GREEN} para iniciar.${NC}"
echo ""
