# 🐛 Troubleshooting - Erro "process is not defined"

## Problema

Ao fazer deploy em Docker, a aplicação apresenta o erro:

```
Uncaught ReferenceError: process is not defined
    at S_ (index-CJOPaM-l.js:446:13562)
    at index-CJOPaM-l.js:446:14397
```

## Causa Raiz

Este erro ocorre porque:

1. **Em desenvolvimento**: Vite define `process.env` automaticamente via `define` no `vite.config.ts`
2. **Em produção (Docker)**: O bundle final (HTML estático servido pelo Nginx) não tem `process` definido
3. Alguma parte do código está tentando acessar `process.exit()`, `process.versions`, ou `process.env` diretamente

## Solução

### 1️⃣ Polyfill para Process (Principal)

✅ **FEITO**: Arquivo `utils/processPolyfill.ts` criado que:
- Define `process` global se não existir
- Proporciona `process.env`, `process.versions`, `process.exit()`
- É importado PRIMEIRO no `index.tsx`

```typescript
// index.tsx - linha 2
import './utils/processPolyfill';
```

### 2️⃣ Vite Config com Define Adequado

✅ **FEITO**: `vite.config.ts` atualizado para:
- Definir `process` como objeto real (não string JSON)
- Incluir `process.env`, `process.versions`, `process.exit`
- Fornecer fallbacks para variáveis comuns

```typescript
define: {
  'process': {
    'env': processEnv,
    'versions': JSON.stringify({}),
    'exit': '(() => {})',
  },
}
```

### 3️⃣ Seguro para Browser

✅ **FEITO**: Removido:
- ❌ `process.exit(1)` no `index.tsx`
- ❌ `process.versions?.node` sem verificação
- ❌ Acesso direto a `process.env` sem guards

Agora usa:
```typescript
const nodeVersion = typeof process !== 'undefined' && process.versions?.node 
  ? process.versions.node 
  : 'N/A (Browser)';
```

## Como Testar Localmente

### Build para Produção

```bash
# 1. Build do bundle
npm run build

# 2. Preview local (simula produção)
npm run preview

# 3. Abrir em http://localhost:4173
# Verificar console do navegador - não deve haver erro de "process"
```

### Build para Docker

```bash
# 1. Build da imagem
docker build -t gridd:test .

# 2. Executar container
docker run -p 80:8080 \
  -e VITE_API_URL=http://localhost:3001/api \
  -e VITE_APP_URL=http://localhost \
  -e VITE_GOOGLE_CLIENT_ID=seu-client-id \
  gridd:test

# 3. Abrir em http://localhost
# Verificar console - não deve haver erro
```

## Variáveis de Ambiente no Docker

### Via .env.production

```bash
# Build com variáveis
docker build --build-arg NODE_ENV=production -t gridd:latest .
```

### Via docker-compose.yaml

```yaml
environment:
  - VITE_API_URL=https://api.seu-dominio.com
  - VITE_APP_URL=https://seu-dominio.com
  - VITE_GOOGLE_CLIENT_ID=seu-id
```

### Via env.sh (Runtime)

O script `env.sh` roda quando o container inicia e injeta variáveis em `window._env_`:

```bash
# Em env-config.js (gerado em runtime)
window._env_ = {
  VITE_API_URL: "https://api.seu-dominio.com",
  VITE_APP_URL: "https://seu-dominio.com",
  VITE_GOOGLE_CLIENT_ID: "seu-id",
}
```

## Checklist de Deploy

- ✅ `utils/processPolyfill.ts` existe
- ✅ `index.tsx` importa polyfill PRIMEIRO
- ✅ `vite.config.ts` define `process` corretamente
- ✅ Sem `process.exit()` ou `process.versions` sem guards
- ✅ Dockerfile copia `env.sh`
- ✅ Dockerfile copia `nginx.conf`
- ✅ `index.html` carrega `/env-config.js`
- ✅ `.env.production` configurado corretamente

## Ainda Tem Erro?

### 1. Verificar logs do container

```bash
docker logs gridd-app
```

### 2. Entrar no container e verificar arquivos

```bash
docker exec -it gridd-app sh
ls -la /usr/share/nginx/html/
cat /usr/share/nginx/html/env-config.js
```

### 3. Verificar console do navegador

```javascript
// No console do navegador
console.log(typeof process)        // deve ser 'object'
console.log(process.env)          // deve ser um objeto
console.log(window._env_)         // deve ter variáveis
```

### 4. Verificar arquivo minificado

```bash
# Se o erro cita uma linha específica (como 446:13562)
# Use o source map:
# 1. Habilitar source maps em vite.config.ts
# 2. Build com source map
npm run build
# 3. Upload do source map para ferramenta de análise
```

## Código de Referência

### ✅ Forma Correta (com guard)

```typescript
// Seguro em qualquer ambiente
const nodeVersion = typeof process !== 'undefined' && process.versions?.node 
  ? process.versions.node 
  : 'N/A';

// Usando import.meta.env (recomendado)
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

### ❌ Forma Errada (vai quebrar em produção)

```typescript
// Não fazer!
process.exit(1)
process.versions.node
process.env.REACT_APP_DEBUG

// Usar:
import.meta.env.REACT_APP_DEBUG
```

## Variáveis Seguras em Produção

### ✅ Expor no Frontend (Público)

```env
VITE_API_URL=https://api.seu-dominio.com
VITE_APP_URL=https://seu-dominio.com
VITE_GOOGLE_CLIENT_ID=seu-id.apps.googleusercontent.com
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sk_anon_...
```

### ❌ NÃO Expor (Secrets do Backend)

```env
VITE_GOOGLE_CLIENT_SECRET=xxxxxxxxxxx
VITE_SESSION_SECRET=yyyyyyyyyyy
DATABASE_PASSWORD=zzzzzzzzzzz
API_KEY=aaaaaaaaaaaa
```

## Recursos Adicionais

- 📖 Documentação: `docs/ENV_VARIABLES.md`
- 🐳 Docker: `Dockerfile`, `nginx.conf`, `env.sh`
- ⚙️ Vite: `vite.config.ts`
- 🔧 Config: `config/env.ts`

## Suporte

Se o problema persistir:

1. Limpar build: `rm -rf dist/ && npm run build`
2. Limpar cache Docker: `docker system prune -a`
3. Checar versão do Node: `node --version` (recomendado 18+)
4. Verificar logs completos do Docker
5. Consultar documentação Vite: https://vitejs.dev/guide/env-and-modes.html
