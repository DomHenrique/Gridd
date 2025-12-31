#!/bin/bash

# Quick Deploy Test Script
# Uso: chmod +x deploy-test.sh && ./deploy-test.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        🚀 GRIDD360 - Deploy Test Script                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Clean previous builds
echo -e "${BLUE}Step 1: Limpando builds anteriores...${NC}"
rm -rf dist/ || true
echo -e "${GREEN}✅ Limpeza concluída${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}Step 2: Instalando dependências...${NC}"
npm install --legacy-peer-deps 2>/dev/null || npm install
echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# Step 3: Build for production
echo -e "${BLUE}Step 3: Fazendo build para produção...${NC}"
npm run build
echo -e "${GREEN}✅ Build concluído${NC}"
echo ""

# Step 4: Verify build
echo -e "${BLUE}Step 4: Verificando arquivos do build...${NC}"
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
  echo -e "${GREEN}✅ Arquivos do build OK${NC}"
  echo "   Arquivos gerados:"
  ls -lh dist/ | head -10
else
  echo -e "${RED}❌ Erro: arquivos do build não encontrados${NC}"
  exit 1
fi
echo ""

# Step 5: Test with preview
echo -e "${BLUE}Step 5: Iniciando preview do build (http://localhost:4173)${NC}"
echo -e "${YELLOW}Pressione Ctrl+C para parar o preview${NC}"
echo ""
npm run preview &
PREVIEW_PID=$!
sleep 3

# Test if preview is running
if kill -0 $PREVIEW_PID 2>/dev/null; then
  echo -e "${GREEN}✅ Preview rodando${NC}"
  echo ""
  echo -e "${BLUE}Checklist de Verificação:${NC}"
  echo "  1. Abra http://localhost:4173 no navegador"
  echo "  2. Abra DevTools (F12)"
  echo "  3. Vá para Console"
  echo "  4. Verifique:"
  echo "     • Nenhum erro de 'process is not defined'"
  echo "     • typeof process === 'object'"
  echo "     • console.log(window._env_) mostra variáveis"
  echo ""
  echo -e "${YELLOW}Aguardando entrada...${NC}"
  read -p "Pressione ENTER para parar o preview e continuar com Docker"
  kill $PREVIEW_PID 2>/dev/null || true
else
  echo -e "${RED}❌ Erro ao iniciar preview${NC}"
  exit 1
fi

echo ""

# Step 6: Build Docker image
echo -e "${BLUE}Step 6: Fazendo build da imagem Docker...${NC}"
if command -v docker &> /dev/null; then
  docker build -t gridd:test .
  echo -e "${GREEN}✅ Imagem Docker built${NC}"
  echo ""
  
  # Step 7: Run Docker container
  echo -e "${BLUE}Step 7: Executando container Docker...${NC}"
  docker run -d \
    -p 8080:80 \
    -e VITE_API_URL=http://localhost:3001/api \
    -e VITE_APP_URL=http://localhost:8080 \
    -e VITE_GOOGLE_CLIENT_ID=test-client-id \
    --name gridd-test \
    gridd:test
  
  sleep 2
  
  if [ "$(docker ps -q -f name=gridd-test)" ]; then
    echo -e "${GREEN}✅ Container rodando${NC}"
    echo ""
    echo -e "${BLUE}Próximas verificações:${NC}"
    echo "  1. Abra http://localhost:8080 no navegador"
    echo "  2. Verifique se não há erro de 'process is not defined'"
    echo "  3. Verifique logs: docker logs gridd-test"
    echo ""
    echo -e "${YELLOW}Para parar o container:${NC}"
    echo "  docker stop gridd-test && docker rm gridd-test"
  else
    echo -e "${RED}❌ Erro ao executar container${NC}"
    docker logs gridd-test || true
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  Docker não instalado, pulando teste Docker${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo -e "║          ${GREEN}✅ TESTES CONCLUÍDOS COM SUCESSO!${NC}                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
