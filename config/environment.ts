/**
 * Configuração Centralizada - Carrega variáveis de ambiente
 * Este arquivo é o único ponto de entrada para todas as configurações
 * 
 * IMPORTANTE: Nunca acesse process.env diretamente nos componentes.
 * Sempre use as funções/objetos deste arquivo!
 */

/**
 * Validação de variável de ambiente
 * @param key - Chave da variável
 * @param defaultValue - Valor padrão se não existir
 * @param required - Se é obrigatório (true lança erro se não existir)
 */
function getEnv(key: string, defaultValue?: string, required: boolean = false): string {
  const value = process.env[key] || defaultValue;

  if (required && !value) {
    throw new Error(
      `Variável de ambiente obrigatória não configurada: ${key}\n` +
      `Configure no arquivo .env ou nas variáveis de ambiente do sistema.`
    );
  }

  return value || '';
}

/**
 * Conversor seguro para número
 */
function getEnvNumber(key: string, defaultValue: number = 0, required: boolean = false): number {
  const value = getEnv(key, defaultValue.toString(), required);
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Conversor seguro para booleano
 */
function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = getEnv(key, defaultValue.toString());
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Conversor para array (separado por vírgula)
 */
function getEnvArray(key: string, defaultValue: string[] = []): string[] {
  const value = getEnv(key, defaultValue.join(','));
  return value ? value.split(',').map((v) => v.trim()) : defaultValue;
}

// ============================================================================
// 🌍 AMBIENTE
// ============================================================================

export const ENV = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  APP_URL: getEnv('REACT_APP_APP_URL', 'http://localhost:3000'),
  DEBUG: getEnvBoolean('REACT_APP_DEBUG', false),
  isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
  isProduction: getEnv('NODE_ENV', 'development') === 'production',
  isStaging: getEnv('NODE_ENV', 'development') === 'staging',
} as const;

// ============================================================================
// 🔐 AUTENTICAÇÃO E SESSÃO
// ============================================================================

export const AUTH_CONFIG = {
  SESSION_SECRET: getEnv('REACT_APP_SESSION_SECRET', 'default-secret-change-in-production', true),
  SESSION_TIMEOUT: getEnvNumber('REACT_APP_SESSION_TIMEOUT', 60), // minutos
  ENABLE_REMEMBER_ME: getEnvBoolean('REACT_APP_ENABLE_REMEMBER_ME', true),
  REMEMBER_ME_DURATION: getEnvNumber('REACT_APP_REMEMBER_ME_DURATION', 30), // dias
} as const;

// ============================================================================
// 🔵 GOOGLE OAUTH 2.0
// ============================================================================

export const GOOGLE_CONFIG = {
  CLIENT_ID: getEnv('REACT_APP_GOOGLE_CLIENT_ID', '', true),
  CLIENT_SECRET: getEnv('REACT_APP_GOOGLE_CLIENT_SECRET', '', ENV.isProduction),
  REDIRECT_URI: getEnv('REACT_APP_GOOGLE_REDIRECT_URI', 'http://localhost:3000/auth/callback', true),
  SCOPES: getEnvArray(
    'REACT_APP_GOOGLE_PHOTOS_SCOPES',
    [
      'https://www.googleapis.com/auth/photoslibrary.readonly',
      'https://www.googleapis.com/auth/photoslibrary.edit.appsource',
    ]
  ),
  ENABLED: getEnvBoolean('REACT_APP_ENABLE_GOOGLE_PHOTOS', true),
} as const;

// ============================================================================
// 📤 UPLOAD
// ============================================================================

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: getEnvNumber('REACT_APP_MAX_FILE_SIZE_MB', 100) * 1024 * 1024, // bytes
  MAX_TOTAL_SIZE: getEnvNumber('REACT_APP_MAX_TOTAL_UPLOAD_SIZE_MB', 1000) * 1024 * 1024, // bytes
  TIMEOUT: getEnvNumber('REACT_APP_UPLOAD_TIMEOUT_MINUTES', 30) * 60 * 1000, // ms
  MAX_RETRIES: getEnvNumber('REACT_APP_MAX_UPLOAD_RETRIES', 3),
  ALLOWED_TYPES: getEnvArray('REACT_APP_ALLOWED_FILE_TYPES', [
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff',
    'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv',
  ]),
  DIRECTORY: getEnv('REACT_APP_UPLOAD_DIRECTORY', '/uploads'),
  ENABLE_COMPRESSION: getEnvBoolean('REACT_APP_ENABLE_IMAGE_COMPRESSION', true),
  COMPRESSION_QUALITY: getEnvNumber('REACT_APP_COMPRESSION_QUALITY', 85),
} as const;

// ============================================================================
// 💾 BANCO DE DADOS
// ============================================================================

export const DATABASE_CONFIG = {
  TYPE: getEnv('REACT_APP_DATABASE_TYPE', 'postgres'),
  HOST: getEnv('REACT_APP_DATABASE_HOST', 'localhost'),
  PORT: getEnvNumber('REACT_APP_DATABASE_PORT', 5432),
  NAME: getEnv('REACT_APP_DATABASE_NAME', 'gridd360_db'),
  USER: getEnv('REACT_APP_DATABASE_USER', 'gridd360_user'),
  PASSWORD: getEnv('REACT_APP_DATABASE_PASSWORD', '', ENV.isProduction),
  POOL_MIN: getEnvNumber('REACT_APP_DATABASE_POOL_MIN', 2),
  POOL_MAX: getEnvNumber('REACT_APP_DATABASE_POOL_MAX', 10),
  TIMEOUT: getEnvNumber('REACT_APP_DATABASE_TIMEOUT', 5000),
  SSL: getEnvBoolean('REACT_APP_DATABASE_SSL', false),
  LOG_QUERIES: getEnvBoolean('REACT_APP_DATABASE_LOG_QUERIES', false),

  // URL de conexão montada
  get CONNECTION_URL(): string {
    if (this.TYPE === 'sqlite') {
      return `sqlite://${this.NAME}.db`;
    }
    const password = this.PASSWORD ? `${this.USER}:${this.PASSWORD}@` : `${this.USER}@`;
    return `${this.TYPE}://${password}${this.HOST}:${this.PORT}/${this.NAME}`;
  },
} as const;

// ============================================================================
// 🗄️ CACHE
// ============================================================================

export const CACHE_CONFIG = {
  TYPE: getEnv('REACT_APP_CACHE_TYPE', 'memory'),
  REDIS_HOST: getEnv('REACT_APP_REDIS_HOST', 'localhost'),
  REDIS_PORT: getEnvNumber('REACT_APP_REDIS_PORT', 6379),
  REDIS_PASSWORD: getEnv('REACT_APP_REDIS_PASSWORD', ''),
  REDIS_DB: getEnvNumber('REACT_APP_REDIS_DB', 0),
  TTL: getEnvNumber('REACT_APP_CACHE_TTL', 300), // segundos
  ALBUMS_TTL: getEnvNumber('REACT_APP_CACHE_ALBUMS_TTL', 300),
  MEDIA_TTL: getEnvNumber('REACT_APP_CACHE_MEDIA_TTL', 600),
  PERMISSIONS_TTL: getEnvNumber('REACT_APP_CACHE_PERMISSIONS_TTL', 900),
  MAX_SIZE: getEnvNumber('REACT_APP_CACHE_MAX_SIZE', 1000),

  // URL de conexão Redis montada
  get REDIS_URL(): string {
    const auth = this.REDIS_PASSWORD ? `:${this.REDIS_PASSWORD}@` : '';
    return `redis://${auth}${this.REDIS_HOST}:${this.REDIS_PORT}/${this.REDIS_DB}`;
  },
} as const;

// ============================================================================
// 🔄 SINCRONIZAÇÃO
// ============================================================================

export const SYNC_CONFIG = {
  INTERVAL: getEnvNumber('REACT_APP_SYNC_INTERVAL', 5) * 60 * 1000, // ms
  MAX_PENDING_OPS: getEnvNumber('REACT_APP_MAX_PENDING_OPS', 100),
  TIMEOUT: getEnvNumber('REACT_APP_SYNC_TIMEOUT', 2) * 60 * 1000, // ms
  BATCH_SIZE: getEnvNumber('REACT_APP_SYNC_BATCH_SIZE', 50),
  ENABLED: getEnvBoolean('REACT_APP_ENABLE_AUTO_SYNC', true),
} as const;

// ============================================================================
// 🔒 SEGURANÇA
// ============================================================================

export const SECURITY_CONFIG = {
  ENCRYPTION_KEY: getEnv(
    'REACT_APP_ENCRYPTION_KEY',
    'default-encryption-key-change-in-production',
    ENV.isProduction
  ),
  FORCE_HTTPS: getEnvBoolean('REACT_APP_FORCE_HTTPS', ENV.isProduction),
  CORS_ORIGINS: getEnvArray('REACT_APP_CORS_ORIGINS', ['http://localhost:3000']),
  ENABLE_CORS: getEnvBoolean('REACT_APP_ENABLE_CORS', true),
  RATE_LIMIT_REQUESTS: getEnvNumber('REACT_APP_RATE_LIMIT_REQUESTS', 100),
  RATE_LIMIT_WINDOW: getEnvNumber('REACT_APP_RATE_LIMIT_WINDOW', 1),
  ENABLE_RATE_LIMIT: getEnvBoolean('REACT_APP_ENABLE_RATE_LIMIT', true),
  ENABLE_AUDIT_LOGS: getEnvBoolean('REACT_APP_ENABLE_AUDIT_LOGS', true),
  MAX_AUDIT_LOGS: getEnvNumber('REACT_APP_MAX_AUDIT_LOGS', 5000),
  REQUIRE_DELETE_CONFIRMATION: getEnvBoolean('REACT_APP_REQUIRE_CONFIRMATION_FOR_DELETE', true),
} as const;

// ============================================================================
// 📊 APIS E INTEGRAÇÕES
// ============================================================================

export const INTEGRATIONS_CONFIG = {
  SENTRY_DSN: getEnv('REACT_APP_SENTRY_DSN', ''),
  SENTRY_ENVIRONMENT: getEnv('REACT_APP_SENTRY_ENVIRONMENT', ENV.NODE_ENV),
  ENABLE_SENTRY: getEnvBoolean('REACT_APP_ENABLE_SENTRY', false),

  GOOGLE_ANALYTICS_ID: getEnv('REACT_APP_GOOGLE_ANALYTICS_ID', ''),
  ENABLE_ANALYTICS: getEnvBoolean('REACT_APP_ENABLE_ANALYTICS', false),

  CUSTOM_API_KEY: getEnv('REACT_APP_CUSTOM_API_KEY', ''),
  API_BASE_URL: getEnv('REACT_APP_API_BASE_URL', 'http://localhost:5000/api'),
  REQUEST_TIMEOUT: getEnvNumber('REACT_APP_REQUEST_TIMEOUT', 30000),
} as const;

// ============================================================================
// 📧 EMAIL
// ============================================================================

export const EMAIL_CONFIG = {
  PROVIDER: getEnv('REACT_APP_EMAIL_PROVIDER', 'smtp'),
  
  // SMTP
  SMTP_HOST: getEnv('REACT_APP_SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT: getEnvNumber('REACT_APP_SMTP_PORT', 587),
  SMTP_SECURE: getEnvBoolean('REACT_APP_SMTP_SECURE', true),
  SMTP_USER: getEnv('REACT_APP_SMTP_USER', ''),
  SMTP_PASSWORD: getEnv('REACT_APP_SMTP_PASSWORD', ''),
  
  // SendGrid
  SENDGRID_API_KEY: getEnv('REACT_APP_SENDGRID_API_KEY', ''),
  
  // Mailgun
  MAILGUN_API_KEY: getEnv('REACT_APP_MAILGUN_API_KEY', ''),
  MAILGUN_DOMAIN: getEnv('REACT_APP_MAILGUN_DOMAIN', ''),
  
  // Geral
  FROM: getEnv('REACT_APP_EMAIL_FROM', 'noreply@gridd360.com'),
} as const;

// ============================================================================
// 📱 NOTIFICAÇÕES
// ============================================================================

export const NOTIFICATIONS_CONFIG = {
  PROVIDER: getEnv('REACT_APP_PUSH_NOTIFICATION_PROVIDER', 'firebase'),
  
  // Firebase
  FIREBASE_PROJECT_ID: getEnv('REACT_APP_FIREBASE_PROJECT_ID', ''),
  FIREBASE_API_KEY: getEnv('REACT_APP_FIREBASE_API_KEY', ''),
  FIREBASE_AUTH_DOMAIN: getEnv('REACT_APP_FIREBASE_AUTH_DOMAIN', ''),
  FIREBASE_DATABASE_URL: getEnv('REACT_APP_FIREBASE_DATABASE_URL', ''),
  
  // OneSignal
  ONESIGNAL_APP_ID: getEnv('REACT_APP_ONESIGNAL_APP_ID', ''),
  
  // Pusher
  PUSHER_APP_ID: getEnv('REACT_APP_PUSHER_APP_ID', ''),
  PUSHER_KEY: getEnv('REACT_APP_PUSHER_KEY', ''),
  PUSHER_SECRET: getEnv('REACT_APP_PUSHER_SECRET', ''),
  PUSHER_CLUSTER: getEnv('REACT_APP_PUSHER_CLUSTER', ''),
} as const;

// ============================================================================
// 📊 MONITORAMENTO E LOGS
// ============================================================================

export const LOGGING_CONFIG = {
  LEVEL: getEnv('REACT_APP_LOG_LEVEL', 'info'),
  ENABLE_CONSOLE: getEnvBoolean('REACT_APP_ENABLE_CONSOLE_LOGS', true),
  ENABLE_FILE: getEnvBoolean('REACT_APP_ENABLE_FILE_LOGS', false),
  DIRECTORY: getEnv('REACT_APP_LOG_DIRECTORY', './logs'),
  MAX_SIZE: getEnvNumber('REACT_APP_LOG_MAX_SIZE', 10),
  MAX_DAYS: getEnvNumber('REACT_APP_LOG_MAX_DAYS', 7),
  MONITORING_API_KEY: getEnv('REACT_APP_MONITORING_API_KEY', ''),
} as const;

// ============================================================================
// 🎨 DESIGN E TEMA
// ============================================================================

export const DESIGN_CONFIG = {
  PRIMARY_COLOR: getEnv('REACT_APP_PRIMARY_COLOR', '#FF6B26'),
  SECONDARY_COLOR: getEnv('REACT_APP_SECONDARY_COLOR', '#101663'),
  ENABLE_DARK_MODE: getEnvBoolean('REACT_APP_ENABLE_DARK_MODE', true),
  DEFAULT_THEME: getEnv('REACT_APP_DEFAULT_THEME', 'light'),
  ENABLE_ANIMATIONS: getEnvBoolean('REACT_APP_ENABLE_ANIMATIONS', true),
  ENABLE_SOUNDS: getEnvBoolean('REACT_APP_ENABLE_SOUNDS', true),
} as const;

// ============================================================================
// 🔧 DESENVOLVIMENTO
// ============================================================================

export const DEV_CONFIG = {
  PORT: getEnvNumber('REACT_APP_PORT', 3000),
  BACKEND_PORT: getEnvNumber('REACT_APP_BACKEND_PORT', 5000),
  ENABLE_HOT_RELOAD: getEnvBoolean('REACT_APP_ENABLE_HOT_RELOAD', true),
  VERBOSE_ERRORS: getEnvBoolean('REACT_APP_VERBOSE_ERRORS', true),
  ENABLE_NETWORK_THROTTLING: getEnvBoolean('REACT_APP_ENABLE_NETWORK_THROTTLING', false),
  NETWORK_DELAY: getEnvNumber('REACT_APP_NETWORK_DELAY', 0),
  SIMULATE_NETWORK_ERRORS: getEnvBoolean('REACT_APP_SIMULATE_NETWORK_ERRORS', false),
  ENABLE_API_MOCK: getEnvBoolean('REACT_APP_ENABLE_API_MOCK', false),
} as const;

// ============================================================================
// 📋 RECURSOS E FEATURES
// ============================================================================

export const FEATURES_CONFIG = {
  ENABLE_USER_MANAGEMENT: getEnvBoolean('REACT_APP_ENABLE_USER_MANAGEMENT', true),
  ENABLE_PERMISSIONS_MANAGEMENT: getEnvBoolean('REACT_APP_ENABLE_PERMISSIONS_MANAGEMENT', true),
  ENABLE_ALBUM_MANAGEMENT: getEnvBoolean('REACT_APP_ENABLE_ALBUM_MANAGEMENT', true),
  ENABLE_ADVANCED_SEARCH: getEnvBoolean('REACT_APP_ENABLE_ADVANCED_SEARCH', true),
  ENABLE_ANALYTICS_FEATURES: getEnvBoolean('REACT_APP_ENABLE_ANALYTICS_FEATURES', true),
  ENABLE_DATA_EXPORT: getEnvBoolean('REACT_APP_ENABLE_DATA_EXPORT', true),
  ENABLE_DATA_IMPORT: getEnvBoolean('REACT_APP_ENABLE_DATA_IMPORT', true),
  ITEMS_PER_PAGE: getEnvNumber('REACT_APP_ITEMS_PER_PAGE', 20),
  MAX_SEARCH_RESULTS: getEnvNumber('REACT_APP_MAX_SEARCH_RESULTS', 100),
} as const;

// ============================================================================
// 🌐 INTERNACIONALIZAÇÃO
// ============================================================================

export const I18N_CONFIG = {
  DEFAULT_LANGUAGE: getEnv('REACT_APP_DEFAULT_LANGUAGE', 'pt-BR'),
  SUPPORTED_LANGUAGES: getEnvArray('REACT_APP_SUPPORTED_LANGUAGES', ['pt-BR', 'en', 'es']),
  AUTO_DETECT_LANGUAGE: getEnvBoolean('REACT_APP_AUTO_DETECT_LANGUAGE', true),
  DEFAULT_TIMEZONE: getEnv('REACT_APP_DEFAULT_TIMEZONE', 'America/Sao_Paulo'),
} as const;

// ============================================================================
// 🏢 EMPRESA
// ============================================================================

export const COMPANY_CONFIG = {
  APP_NAME: getEnv('REACT_APP_APP_NAME', 'Gridd360 Asset Manager'),
  NAME: getEnv('REACT_APP_COMPANY_NAME', 'Gridd360'),
  SUPPORT_EMAIL: getEnv('REACT_APP_SUPPORT_EMAIL', 'support@gridd360.com'),
  WEBSITE: getEnv('REACT_APP_COMPANY_WEBSITE', 'https://gridd360.com'),
  LOGO_URL: getEnv('REACT_APP_COMPANY_LOGO_URL', 'https://gridd360.com/logo.png'),
  FAVICON_URL: getEnv('REACT_APP_FAVICON_URL', 'https://gridd360.com/favicon.ico'),
  PRIMARY_COLOR: getEnv('REACT_APP_BRAND_PRIMARY_COLOR', '#FF6B26'),
  SECONDARY_COLOR: getEnv('REACT_APP_BRAND_SECONDARY_COLOR', '#101663'),
  ADDRESS: getEnv('REACT_APP_COMPANY_ADDRESS', ''),
  PHONE: getEnv('REACT_APP_COMPANY_PHONE', ''),
  PRIVACY_POLICY_URL: getEnv('REACT_APP_PRIVACY_POLICY_URL', 'https://gridd360.com/privacy'),
  TERMS_OF_SERVICE_URL: getEnv('REACT_APP_TERMS_OF_SERVICE_URL', 'https://gridd360.com/terms'),
} as const;

// ============================================================================
// 🔍 VALIDAÇÃO E DIAGNÓSTICO
// ============================================================================

/**
 * Valida se as configurações essenciais estão presentes
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar Google OAuth
  if (GOOGLE_CONFIG.ENABLED) {
    if (!GOOGLE_CONFIG.CLIENT_ID) {
      errors.push('Google Client ID não configurado');
    }
    if (ENV.isProduction && !GOOGLE_CONFIG.CLIENT_SECRET) {
      errors.push('Google Client Secret não configurado em produção');
    }
  }

  // Validar Email em produção
  if (ENV.isProduction && EMAIL_CONFIG.PROVIDER === 'smtp') {
    if (!EMAIL_CONFIG.SMTP_USER || !EMAIL_CONFIG.SMTP_PASSWORD) {
      errors.push('Credenciais SMTP não configuradas');
    }
  }

  // Validar Banco de Dados
  if (ENV.isProduction && DATABASE_CONFIG.TYPE !== 'sqlite') {
    if (!DATABASE_CONFIG.PASSWORD) {
      errors.push('Senha do banco de dados não configurada');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Registra configurações de diagnóstico (sem sensíveis)
 */
export function logConfig(): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('⚙️  CONFIGURAÇÕES DE AMBIENTE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Ambiente: ${ENV.NODE_ENV}`);
  console.log(`App URL: ${ENV.APP_URL}`);
  console.log(`Debug: ${ENV.DEBUG}`);
  console.log(`Banco: ${DATABASE_CONFIG.TYPE} (${DATABASE_CONFIG.HOST}:${DATABASE_CONFIG.PORT})`);
  console.log(`Cache: ${CACHE_CONFIG.TYPE}`);
  console.log(`Google Photos: ${GOOGLE_CONFIG.ENABLED ? 'Ativado' : 'Desativado'}`);
  console.log('═══════════════════════════════════════════════════════════');
}

// Exportar tudo
export default {
  ENV,
  AUTH_CONFIG,
  GOOGLE_CONFIG,
  UPLOAD_CONFIG,
  DATABASE_CONFIG,
  CACHE_CONFIG,
  SYNC_CONFIG,
  SECURITY_CONFIG,
  INTEGRATIONS_CONFIG,
  EMAIL_CONFIG,
  NOTIFICATIONS_CONFIG,
  LOGGING_CONFIG,
  DESIGN_CONFIG,
  DEV_CONFIG,
  FEATURES_CONFIG,
  I18N_CONFIG,
  COMPANY_CONFIG,
  validateConfig,
  logConfig,
};
