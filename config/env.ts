/**
 * Configuração de Variáveis de Ambiente
 * Carrega e valida todas as variáveis necessárias
 */

// ============================================================================
// TIPOS DE CONFIGURAÇÃO
// ============================================================================

export interface EnvConfig {
  // Ambiente
  nodeEnv: 'development' | 'staging' | 'production';
  appUrl: string;
  apiUrl: string;
  debug: boolean;

  // Autenticação
  sessionSecret: string;
  sessionTimeout: number;
  enableRememberMe: boolean;
  rememberMeDuration: number;

  // Google OAuth
  googleClientId: string;
  googleRedirectUri: string;
  googlePhotosScopes: string[];
  enableGooglePhotos: boolean;

  // Upload
  maxFileSizeMb: number;
  maxTotalUploadSizeMb: number;

  // APIs
  geminiApiKey?: string;

  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// ============================================================================
// FUNÇÕES DE CARREGAMENTO
// ============================================================================

/**
 * Obtém valor de variável de ambiente
 */
export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Tenta diferentes prefixos (REACT_APP_, VITE_)
  // Prioridade: window._env_ (Docker/Runtime) > import.meta.env (Vite/Build)
  const runtimeEnv = (typeof window !== 'undefined' && (window as any)._env_) ? (window as any)._env_ : {};
  const env = import.meta.env as any;
  
  // Normaliza a chave para buscar no window._env_ (que geralmente removemos o prefixo VITE_ no env.sh, mas vamos checar tudo)
  const value = 
    runtimeEnv[key] ||
    runtimeEnv[`VITE_${key}`] ||
    runtimeEnv[`REACT_APP_${key}`] ||
    env[key] ||
    env[`REACT_APP_${key}`] ||
    env[`VITE_${key}`];

  if (value) return value;
  
  if (defaultValue) {
    if (env.DEBUG === 'true' || runtimeEnv.VITE_DEBUG === 'true') {
        console.warn(`[Env] Variável ${key} não encontrada, usando valor padrão.`);
    }
    return defaultValue;
  }

  return '';
}

/**
 * Obtém número de variável de ambiente
 */
function getEnvNumber(key: string, defaultValue?: number): number {
  const value = getEnvVar(key);
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue || 0 : num;
}

/**
 * Obtém booleano de variável de ambiente
 */
function getEnvBoolean(key: string, defaultValue = false): boolean {
  const value = getEnvVar(key, String(defaultValue));
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Obtém array de variável de ambiente (separado por vírgula)
 */
function getEnvArray(key: string, defaultValue: string[] = []): string[] {
  const value = getEnvVar(key);
  return value ? value.split(',').map(v => v.trim()) : defaultValue;
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Valida variáveis obrigatórias
 */
function validateRequiredEnvVars(config: EnvConfig): string[] {
  const errors: string[] = [];

  if (!config.appUrl) {
    errors.push('❌ REACT_APP_APP_URL é obrigatório');
  }

  if (!config.googleClientId) {
    errors.push('❌ REACT_APP_GOOGLE_CLIENT_ID é obrigatório');
  }

  if (!config.sessionSecret || config.sessionSecret.includes('mudeme')) {
    errors.push('⚠️  Aviso: VITE_SESSION_SECRET não configurado ou usando valor padrão. Configure para maior segurança.');
  }

  if (config.nodeEnv === 'production') {
    if (config.debug) {
      errors.push('⚠️  Aviso: Debug está ativado em produção');
    }
  }

  return errors;
}

/**
 * Valida formatos
 */
function validateEnvFormats(config: EnvConfig): string[] {
  const errors: string[] = [];

  // Valida URL
  try {
    new URL(config.appUrl);
  } catch {
    errors.push('❌ REACT_APP_APP_URL deve ser uma URL válida');
  }

  // Valida Google Client ID
  if (!config.googleClientId.includes('.apps.googleusercontent.com')) {
    errors.push('❌ VITE_GOOGLE_CLIENT_ID parece inválido (deve terminar com .apps.googleusercontent.com)');
  }

  // Valida timeout
  if (config.sessionTimeout < 5 || config.sessionTimeout > 1440) {
    errors.push('⚠️  REACT_APP_SESSION_TIMEOUT deve estar entre 5 e 1440 minutos');
  }

  // Valida tamanho de arquivo
  if (config.maxFileSizeMb <= 0) {
    errors.push('❌ REACT_APP_MAX_FILE_SIZE_MB deve ser maior que 0');
  }

  return errors;
}

// ============================================================================
// CARREGAMENTO PRINCIPAL
// ============================================================================

/**
 * Carrega e retorna configuração de ambiente
 */
export function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    // Ambiente
    nodeEnv: (getEnvVar('NODE_ENV', 'development') as any) || 'development',
    appUrl: getEnvVar('APP_URL', 'http://localhost:3000'),
    apiUrl: getEnvVar('API_URL', 'http://localhost:3001/api'),
    debug: getEnvBoolean('DEBUG', false),

    // Autenticação
    sessionSecret: getEnvVar('SESSION_SECRET', 'sua-chave-secreta-muito-segura-mudeme-em-producao'),
    sessionTimeout: getEnvNumber('SESSION_TIMEOUT', 60),
    enableRememberMe: getEnvBoolean('ENABLE_REMEMBER_ME', true),
    rememberMeDuration: getEnvNumber('REMEMBER_ME_DURATION', 30),

    // Google OAuth
    googleClientId: getEnvVar('GOOGLE_CLIENT_ID', ''),
    googleRedirectUri: getEnvVar('GOOGLE_REDIRECT_URI', 'http://localhost:3000/auth/callback'),
    googlePhotosScopes: getEnvArray('GOOGLE_PHOTOS_SCOPES', [
      'https://www.googleapis.com/auth/photoslibrary.readonly',
      'https://www.googleapis.com/auth/photoslibrary.edit.appsource',
    ]),
    enableGooglePhotos: getEnvBoolean('ENABLE_GOOGLE_PHOTOS', true),

    // Upload
    maxFileSizeMb: getEnvNumber('MAX_FILE_SIZE_MB', 100),
    maxTotalUploadSizeMb: getEnvNumber('MAX_TOTAL_UPLOAD_SIZE_MB', 1000),

    // APIs
    geminiApiKey: getEnvVar('GEMINI_API_KEY'),

    // Supabase
    supabaseUrl: getEnvVar('SUPABASE_URL'),
    supabaseAnonKey: getEnvVar('SUPABASE_ANON_KEY'),
  };

  // Valida variáveis
  const errors = [
    ...validateRequiredEnvVars(config),
    ...validateEnvFormats(config),
  ];

  if (errors.length > 0) {
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('⚠️  PROBLEMAS NA CONFIGURAÇÃO DE AMBIENTE');
    console.error('═══════════════════════════════════════════════════════════════');
    errors.forEach(error => console.error(error));
    console.error('═══════════════════════════════════════════════════════════════');

    if (config.nodeEnv === 'production') {
      throw new Error('Configuração de ambiente inválida em produção');
    }
  }

  // Log de sucesso
  if (config.debug) {
    console.log('✅ Configuração de ambiente carregada com sucesso');
    console.log({
      nodeEnv: config.nodeEnv,
      appUrl: config.appUrl,
      apiUrl: config.apiUrl,
      googleClientId: config.googleClientId?.substring(0, 20) + '...',
      sessionTimeout: config.sessionTimeout,
    });
  }

  return config;
}

// ============================================================================
// EXPORTAÇÃO SINGLETON
// ============================================================================

let configInstance: EnvConfig | null = null;

/**
 * Retorna instância singleton da configuração
 */
export function getEnvConfig(): EnvConfig {
  if (!configInstance) {
    configInstance = loadEnvConfig();
  }
  return configInstance;
}

/**
 * Reseta a configuração (útil para testes)
 */
export function resetEnvConfig(): void {
  configInstance = null;
}

// ============================================================================
// FUNÇÕES HELPERS
// ============================================================================

/**
 * Verifica se está em produção
 */
export function isProd(): boolean {
  return getEnvConfig().nodeEnv === 'production';
}

/**
 * Verifica se está em desenvolvimento
 */
export function isDev(): boolean {
  return getEnvConfig().nodeEnv === 'development';
}

/**
 * Obtém URL da API
 */
export function getApiUrl(): string {
  return getEnvConfig().apiUrl;
}

/**
 * Obtém URL da aplicação
 */
export function getAppUrl(): string {
  return getEnvConfig().appUrl;
}

/**
 * Obtém Google Client ID
 */
export function getGoogleClientId(): string {
  return getEnvConfig().googleClientId;
}

/**
 * Obtém timeout da sessão em millisegundos
 */
export function getSessionTimeoutMs(): number {
  return getEnvConfig().sessionTimeout * 60 * 1000;
}

/**
 * Debug logging (só registra em desenvolvimento)
 */
export function debugLog(message: string, data?: any): void {
  if (getEnvConfig().debug) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}
