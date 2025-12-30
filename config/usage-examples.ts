/**
 * Exemplo de Como Usar as Configurações
 * 
 * Este arquivo demonstra como integrar o novo sistema de configurações
 * com as variáveis de ambiente nos serviços existentes.
 */

// ============================================================================
// 1. IMPORTAR CONFIGURAÇÕES
// ============================================================================

import { 
  GOOGLE_CONFIG, 
  DATABASE_CONFIG, 
  CACHE_CONFIG,
  UPLOAD_CONFIG,
  INTEGRATIONS_CONFIG,
  ENV,
  SECURITY_CONFIG,
  FEATURES_CONFIG,
} from '../config/environment';

// ============================================================================
// 2. USAR EM SERVIÇOS
// ============================================================================

// ✅ Exemplo: Usar em services/google-photos/config/config.ts
export const GOOGLE_PHOTOS_CONFIG = {
  CLIENT_ID: GOOGLE_CONFIG.CLIENT_ID,
  CLIENT_SECRET: GOOGLE_CONFIG.CLIENT_SECRET,
  REDIRECT_URI: GOOGLE_CONFIG.REDIRECT_URI,
  SCOPES: GOOGLE_CONFIG.SCOPES,
  ENABLED: GOOGLE_CONFIG.ENABLED,
} as const;

// ✅ Exemplo: Usar em serviço de autenticação
export class GooglePhotosAuthService {
  private clientId = GOOGLE_CONFIG.CLIENT_ID;
  private clientSecret = GOOGLE_CONFIG.CLIENT_SECRET;
  private redirectUri = GOOGLE_CONFIG.REDIRECT_URI;

  getAuthorizationUrl(): string {
    // Usar this.clientId, this.clientSecret, etc.
    // Vem do ambiente, não é hardcoded!
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&...`;
  }
}

// ✅ Exemplo: Usar em upload service
export class UploadService {
  private maxFileSize = UPLOAD_CONFIG.MAX_FILE_SIZE;
  private maxTotalSize = UPLOAD_CONFIG.MAX_TOTAL_SIZE;
  private timeout = UPLOAD_CONFIG.TIMEOUT;
  private allowedTypes = UPLOAD_CONFIG.ALLOWED_TYPES;

  validateFile(file: File): boolean {
    if (file.size > this.maxFileSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${this.maxFileSize / 1024 / 1024}MB`);
    }
    // ... usar allowedTypes para validação
    return true;
  }
}

// ✅ Exemplo: Usar em cache service
export class CacheService {
  private cacheType = CACHE_CONFIG.TYPE;
  private ttl = CACHE_CONFIG.TTL;
  private maxSize = CACHE_CONFIG.MAX_SIZE;

  constructor() {
    if (this.cacheType === 'redis') {
      // Conectar ao Redis usando CACHE_CONFIG.REDIS_URL
      console.log(`Conectando ao Redis: ${CACHE_CONFIG.REDIS_URL}`);
    } else {
      // Usar cache em memória
      console.log('Usando cache em memória');
    }
  }

  get<T>(key: string): T | null {
    // Implementação usando this.ttl
    return null;
  }
}

// ✅ Exemplo: Usar em database service
export class DatabaseService {
  private connectionString = DATABASE_CONFIG.CONNECTION_URL;
  private poolMin = DATABASE_CONFIG.POOL_MIN;
  private poolMax = DATABASE_CONFIG.POOL_MAX;
  private ssl = DATABASE_CONFIG.SSL;

  connect(): void {
    console.log(`Conectando ao banco: ${DATABASE_CONFIG.TYPE}`);
    console.log(`String de conexão: ${this.connectionString}`);
    // Implementação da conexão usando this.connectionString
  }
}

// ============================================================================
// 3. USAR EM COMPONENTES REACT
// ============================================================================

import React, { useEffect, useState } from 'react';

export function ExampleComponent() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Usar configurações em componentes
    if (GOOGLE_CONFIG.ENABLED) {
      console.log('Google Photos está ativado');
    }

    if (FEATURES_CONFIG.ENABLE_USER_MANAGEMENT) {
      console.log('Gerenciamento de usuários está ativado');
    }

    // Passar configs para estado
    setConfig({
      appName: ENV.APP_URL,
      uploadMaxSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
      cacheType: CACHE_CONFIG.TYPE,
    });
  }, []);

  return (
    <div>
      <h1>Configurações da Aplicação</h1>
      <p>App URL: {ENV.APP_URL}</p>
      <p>Cache Type: {CACHE_CONFIG.TYPE}</p>
      {config && <pre>{JSON.stringify(config, null, 2)}</pre>}
    </div>
  );
}

// ============================================================================
// 4. VALIDAÇÃO E TRATAMENTO DE ERROS
// ============================================================================

export function validateAndUseConfig() {
  // Validar antes de usar
  if (!GOOGLE_CONFIG.CLIENT_ID) {
    console.error('Google Client ID não configurado');
    return;
  }

  if (ENV.isProduction && !GOOGLE_CONFIG.CLIENT_SECRET) {
    throw new Error('Client Secret obrigatório em produção');
  }

  // Usar com segurança
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CONFIG.CLIENT_ID}`;
  console.log('Auth URL válida:', authUrl);
}

// ============================================================================
// 5. EXEMPLOS DE MUDANÇAS EM ARQUIVOS EXISTENTES
// ============================================================================

/**
 * ANTES (hardcoded):
 * 
 * export const config = {
 *   googleClientId: 'hardcoded-id-12345',
 *   maxFileSize: 104857600,
 *   cacheType: 'memory',
 * }
 * 
 * DEPOIS (com variáveis de ambiente):
 * 
 * import { GOOGLE_CONFIG, UPLOAD_CONFIG, CACHE_CONFIG } from '../config/environment';
 * 
 * export const config = {
 *   googleClientId: GOOGLE_CONFIG.CLIENT_ID,
 *   maxFileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
 *   cacheType: CACHE_CONFIG.TYPE,
 * }
 */

// ============================================================================
// 6. CONVENÇÕES A USAR
// ============================================================================

/**
 * ✅ CORRETO - Importar do config/environment
 */
import { GOOGLE_CONFIG, DATABASE_CONFIG } from '../config/environment';

function correctExample() {
  const clientId = GOOGLE_CONFIG.CLIENT_ID; // ✅ Correto
  const dbType = DATABASE_CONFIG.TYPE; // ✅ Correto
}

/**
 * ❌ ERRADO - Acessar process.env diretamente
 */
function wrongExample() {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID; // ❌ Evite!
  // Motivo: Sem tipagem, sem validação, sem centralização
}

// ============================================================================
// 7. CHECKLIST DE REFATORAÇÃO
// ============================================================================

/**
 * Para refatorar cada arquivo de serviço:
 * 
 * [ ] 1. Importar configurações do config/environment
 * [ ] 2. Remover imports de ./config ou arquivos locais
 * [ ] 3. Substituir valores hardcoded com imports de config
 * [ ] 4. Remover arquivos config.ts locais (que ficam obsoletos)
 * [ ] 5. Testar se funcionou (logs de inicialização)
 * [ ] 6. Verificar se valores vêm do .env
 * 
 * Exemplo de substituição em services/google-photos/config/config.ts:
 * 
 * ANTES:
 * export const GOOGLE_PHOTOS_CONFIG = {
 *   CLIENT_ID: 'abc123',
 *   CLIENT_SECRET: 'secret456',
 *   REDIRECT_URI: 'http://localhost:3000/callback',
 * };
 * 
 * DEPOIS:
 * import { GOOGLE_CONFIG } from '../../../config/environment';
 * 
 * export const GOOGLE_PHOTOS_CONFIG = GOOGLE_CONFIG;
 * // ou, se precisar transformar:
 * export const GOOGLE_PHOTOS_CONFIG = {
 *   CLIENT_ID: GOOGLE_CONFIG.CLIENT_ID,
 *   CLIENT_SECRET: GOOGLE_CONFIG.CLIENT_SECRET,
 *   REDIRECT_URI: GOOGLE_CONFIG.REDIRECT_URI,
 *   // ... add other properties from GOOGLE_CONFIG
 * };
 */

// ============================================================================
// 8. DEBUGGING
// ============================================================================

export function debugConfig() {
  console.log('='.repeat(60));
  console.log('🔍 CONFIGURAÇÕES CARREGADAS');
  console.log('='.repeat(60));

  // Ambiente
  console.log('\n🌍 Ambiente:');
  console.log(`  NODE_ENV: ${ENV.NODE_ENV}`);
  console.log(`  APP_URL: ${ENV.APP_URL}`);
  console.log(`  DEBUG: ${ENV.DEBUG}`);

  // Google
  console.log('\n🔵 Google:');
  console.log(`  Habilitado: ${GOOGLE_CONFIG.ENABLED}`);
  console.log(`  Client ID: ${GOOGLE_CONFIG.CLIENT_ID ? '✓ Configurado' : '✗ Não configurado'}`);

  // Banco
  console.log('\n💾 Banco de Dados:');
  console.log(`  Tipo: ${DATABASE_CONFIG.TYPE}`);
  console.log(`  Host: ${DATABASE_CONFIG.HOST}`);
  console.log(`  Porta: ${DATABASE_CONFIG.PORT}`);

  // Cache
  console.log('\n🗄️  Cache:');
  console.log(`  Tipo: ${CACHE_CONFIG.TYPE}`);
  console.log(`  TTL: ${CACHE_CONFIG.TTL}s`);

  // Upload
  console.log('\n📤 Upload:');
  console.log(`  Max File: ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
  console.log(`  Max Total: ${UPLOAD_CONFIG.MAX_TOTAL_SIZE / 1024 / 1024}MB`);

  console.log('\n' + '='.repeat(60));
}

// Executar ao iniciar (se necessário)
if (ENV.DEBUG) {
  debugConfig();
}

export default {
  GOOGLE_PHOTOS_CONFIG,
  validateAndUseConfig,
  debugConfig,
};
