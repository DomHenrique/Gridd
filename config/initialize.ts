/**
 * Inicializador de Configurações
 * 
 * Este arquivo deve ser importado no início da aplicação (antes de qualquer outro código)
 * para garantir que todas as variáveis de ambiente estejam carregadas e validadas.
 */

import config, {
  validateConfig,
  logConfig,
  ENV,
  GOOGLE_CONFIG,
  DATABASE_CONFIG,
  CACHE_CONFIG,
} from './environment';

/**
 * Inicializa e valida a configuração da aplicação
 */
export function initializeConfig(): void {
  // Log das configurações (sem sensíveis)
  logConfig();

  // Validar configurações obrigatórias
  const { valid, errors } = validateConfig();

  if (!errors.length) {
    console.log('✅ Todas as configurações estão válidas');
  } else {
    console.warn('⚠️  Problemas na configuração:');
    errors.forEach((error) => console.warn(`  - ${error}`));

    // Em produção, falhar se houver problemas críticos
    if (ENV.isProduction) {
      throw new Error('Configuração inválida em produção');
    }
  }

  // Log de conexão com banco de dados
  console.log(`📦 Banco de Dados: ${DATABASE_CONFIG.TYPE}`);
  if (DATABASE_CONFIG.TYPE !== 'sqlite') {
    console.log(
      `   Conectando a: ${DATABASE_CONFIG.HOST}:${DATABASE_CONFIG.PORT}/${DATABASE_CONFIG.NAME}`
    );
  }

  // Log de cache
  console.log(`🗄️  Cache: ${CACHE_CONFIG.TYPE}`);
  if (CACHE_CONFIG.TYPE === 'redis') {
    console.log(`   Redis: ${CACHE_CONFIG.REDIS_HOST}:${CACHE_CONFIG.REDIS_PORT}`);
  }

  // Log de autenticação
  console.log(`🔐 Google Photos: ${GOOGLE_CONFIG.ENABLED ? 'Ativado' : 'Desativado'}`);
}

/**
 * Obtém configuração por caminho (ex: 'GOOGLE_CONFIG.CLIENT_ID')
 */
export function getConfig(path: string): any {
  const parts = path.split('.');
  let value: any = config;

  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) {
      console.warn(`⚠️  Configuração não encontrada: ${path}`);
      return undefined;
    }
  }

  return value;
}

/**
 * Verifica se uma feature está ativada
 */
export function isFeatureEnabled(featureName: string): boolean {
  const { FEATURES_CONFIG } = config;
  const featureKey = `ENABLE_${featureName.toUpperCase()}`;
  return (FEATURES_CONFIG as any)?.[featureKey] ?? false;
}

/**
 * Hotspot para desenvolvimento: simula mudanças em env vars
 * (apenas para desenvolvimento)
 */
export function overrideConfig(overrides: Record<string, any>): void {
  if (!ENV.isDevelopment) {
    console.warn('⚠️  overrideConfig só funciona em desenvolvimento');
    return;
  }

  console.log('🔧 Aplicando overrides de configuração:', overrides);

  Object.entries(overrides).forEach(([key, value]) => {
    (config as any)[key] = value;
  });
}

export default config;
