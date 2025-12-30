/**
 * Ferramentas de Validação e Diagnóstico de Configurações
 * 
 * Utilitários para verificar o status das variáveis de ambiente
 */

import { validateConfig, logConfig, ENV } from './environment';

/**
 * Classe para validação avançada de configurações
 */
export class ConfigValidator {
  private errors: string[] = [];
  private warnings: string[] = [];
  private info: string[] = [];

  /**
   * Executa todas as validações
   */
  validate(): { isValid: boolean; errors: string[]; warnings: string[]; info: string[] } {
    this.errors = [];
    this.warnings = [];
    this.info = [];

    this.validateEnvironment();
    this.validateGoogle();
    this.validateDatabase();
    this.validateCache();
    this.validateSecurity();
    this.validateEmails();
    this.validateProduction();

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
    };
  }

  /**
   * Validação de ambiente
   */
  private validateEnvironment(): void {
    if (!ENV.NODE_ENV) {
      this.errors.push('NODE_ENV não definido');
    } else if (!['development', 'production', 'staging'].includes(ENV.NODE_ENV)) {
      this.warnings.push(
        `NODE_ENV "${ENV.NODE_ENV}" não é reconhecido. Use: development, production, staging`
      );
    }

    if (!ENV.APP_URL) {
      this.warnings.push('REACT_APP_APP_URL não definido');
    }
  }

  /**
   * Validação de Google OAuth
   */
  private validateGoogle(): void {
    const { GOOGLE_CONFIG } = require('./environment');

    if (!GOOGLE_CONFIG.ENABLED) {
      this.info.push('Google Photos: Desativado');
      return;
    }

    if (!GOOGLE_CONFIG.CLIENT_ID) {
      this.errors.push('Google: CLIENT_ID não configurado');
    }

    if (!GOOGLE_CONFIG.REDIRECT_URI) {
      this.errors.push('Google: REDIRECT_URI não configurado');
    }

    if (ENV.isProduction && !GOOGLE_CONFIG.CLIENT_SECRET) {
      this.errors.push('Google: CLIENT_SECRET obrigatório em produção');
    } else if (GOOGLE_CONFIG.CLIENT_SECRET) {
      this.info.push('Google: Credenciais configuradas');
    }

    if (!GOOGLE_CONFIG.SCOPES || GOOGLE_CONFIG.SCOPES.length === 0) {
      this.warnings.push('Google: SCOPES vazio (será usado padrão)');
    }
  }

  /**
   * Validação de banco de dados
   */
  private validateDatabase(): void {
    const { DATABASE_CONFIG } = require('./environment');

    const validTypes = ['postgres', 'mysql', 'sqlite', 'mongodb'];
    if (!validTypes.includes(DATABASE_CONFIG.TYPE)) {
      this.errors.push(
        `Banco: Tipo "${DATABASE_CONFIG.TYPE}" inválido. Use: ${validTypes.join(', ')}`
      );
    }

    if (DATABASE_CONFIG.TYPE !== 'sqlite') {
      if (!DATABASE_CONFIG.HOST) {
        this.errors.push('Banco: HOST não configurado');
      }

      if (!DATABASE_CONFIG.PORT) {
        this.errors.push('Banco: PORT não configurado');
      }

      if (ENV.isProduction && !DATABASE_CONFIG.PASSWORD) {
        this.errors.push('Banco: PASSWORD obrigatória em produção');
      }
    }

    if (DATABASE_CONFIG.POOL_MAX < DATABASE_CONFIG.POOL_MIN) {
      this.errors.push(
        `Banco: POOL_MAX (${DATABASE_CONFIG.POOL_MAX}) deve ser >= POOL_MIN (${DATABASE_CONFIG.POOL_MIN})`
      );
    }

    this.info.push(`Banco: ${DATABASE_CONFIG.TYPE}`);
  }

  /**
   * Validação de cache
   */
  private validateCache(): void {
    const { CACHE_CONFIG } = require('./environment');

    const validTypes = ['memory', 'redis', 'memcached'];
    if (!validTypes.includes(CACHE_CONFIG.TYPE)) {
      this.errors.push(
        `Cache: Tipo "${CACHE_CONFIG.TYPE}" inválido. Use: ${validTypes.join(', ')}`
      );
    }

    if (CACHE_CONFIG.TYPE === 'redis') {
      if (!CACHE_CONFIG.REDIS_HOST) {
        this.errors.push('Cache Redis: HOST não configurado');
      }

      if (!CACHE_CONFIG.REDIS_PORT) {
        this.errors.push('Cache Redis: PORT não configurado');
      }
    }

    this.info.push(`Cache: ${CACHE_CONFIG.TYPE}`);
  }

  /**
   * Validação de segurança
   */
  private validateSecurity(): void {
    const { SECURITY_CONFIG } = require('./environment');

    if (!SECURITY_CONFIG.ENCRYPTION_KEY) {
      this.warnings.push('Segurança: ENCRYPTION_KEY não configurada');
    }

    if (ENV.isProduction && !SECURITY_CONFIG.FORCE_HTTPS) {
      this.warnings.push('Segurança: FORCE_HTTPS deveria estar ativada em produção');
    }

    if (!SECURITY_CONFIG.CORS_ORIGINS || SECURITY_CONFIG.CORS_ORIGINS.length === 0) {
      this.warnings.push('Segurança: CORS_ORIGINS não definida');
    }

    if (SECURITY_CONFIG.CORS_ORIGINS.includes('*')) {
      this.warnings.push('Segurança: CORS permite todos os origins (*) - perigoso em produção');
    }
  }

  /**
   * Validação de email
   */
  private validateEmails(): void {
    const { EMAIL_CONFIG } = require('./environment');

    if (EMAIL_CONFIG.PROVIDER === 'smtp') {
      if (!EMAIL_CONFIG.SMTP_HOST) {
        this.warnings.push('Email SMTP: HOST não configurado');
      }

      if (!EMAIL_CONFIG.SMTP_USER) {
        this.warnings.push('Email SMTP: USER não configurado');
      }
    }

    if (EMAIL_CONFIG.PROVIDER === 'sendgrid' && !EMAIL_CONFIG.SENDGRID_API_KEY) {
      this.warnings.push('Email SendGrid: API_KEY não configurada');
    }

    if (EMAIL_CONFIG.PROVIDER === 'mailgun' && !EMAIL_CONFIG.MAILGUN_API_KEY) {
      this.warnings.push('Email Mailgun: API_KEY não configurada');
    }
  }

  /**
   * Validações específicas de produção
   */
  private validateProduction(): void {
    if (!ENV.isProduction) return;

    if (ENV.DEBUG) {
      this.errors.push('Produção: DEBUG não deveria estar ativado');
    }

    const { SECURITY_CONFIG, DEV_CONFIG } = require('./environment');

    if (DEV_CONFIG.VERBOSE_ERRORS) {
      this.warnings.push('Produção: VERBOSE_ERRORS não deveria estar ativado');
    }

    if (SECURITY_CONFIG.ENCRYPTION_KEY === 'default-encryption-key-change-in-production') {
      this.errors.push('Produção: Use uma ENCRYPTION_KEY própria');
    }
  }

  /**
   * Formata o resultado de forma legível
   */
  formatOutput(result: ReturnType<ConfigValidator['validate']>): string {
    let output = '\n' + '='.repeat(70) + '\n';
    output += '📋 VALIDAÇÃO DE CONFIGURAÇÕES\n';
    output += '='.repeat(70) + '\n\n';

    if (result.errors.length > 0) {
      output += '❌ ERROS CRÍTICOS:\n';
      result.errors.forEach((err) => {
        output += `   • ${err}\n`;
      });
      output += '\n';
    }

    if (result.warnings.length > 0) {
      output += '⚠️  AVISOS:\n';
      result.warnings.forEach((warn) => {
        output += `   • ${warn}\n`;
      });
      output += '\n';
    }

    if (result.info.length > 0) {
      output += 'ℹ️  INFORMAÇÕES:\n';
      result.info.forEach((info) => {
        output += `   • ${info}\n`;
      });
      output += '\n';
    }

    output += '='.repeat(70) + '\n';
    output += result.isValid
      ? '✅ Configuração válida\n'
      : '❌ Existem erros que precisam ser corrigidos\n';
    output += '='.repeat(70) + '\n\n';

    return output;
  }
}

/**
 * Verifica se uma configuração específica está presente
 */
export function hasConfig(key: string): boolean {
  const value = process.env[key];
  return value !== undefined && value !== '';
}

/**
 * Lista todas as variáveis de ambiente carregadas
 */
export function listLoadedEnvVars(): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('REACT_APP_')) {
      result[key] = process.env[key];
    }
  });

  return result;
}

/**
 * Lista variáveis faltando
 */
export function listMissingEnvVars(required: string[]): string[] {
  return required.filter((key) => !hasConfig(key));
}

/**
 * Exporta configurações para arquivo de debug (sem sensíveis)
 */
export function exportConfigForDebug(): Record<string, any> {
  const { ENV, GOOGLE_CONFIG, DATABASE_CONFIG, CACHE_CONFIG, FEATURES_CONFIG } =
    require('./environment');

  return {
    environment: ENV.NODE_ENV,
    debug: ENV.DEBUG,
    features: Object.entries(FEATURES_CONFIG)
      .filter(([key]) => key.startsWith('ENABLE_'))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>),
    database: {
      type: DATABASE_CONFIG.TYPE,
      host: DATABASE_CONFIG.HOST,
      port: DATABASE_CONFIG.PORT,
    },
    cache: {
      type: CACHE_CONFIG.TYPE,
      ttl: CACHE_CONFIG.TTL,
    },
    google: {
      enabled: GOOGLE_CONFIG.ENABLED,
      hasClientId: !!GOOGLE_CONFIG.CLIENT_ID,
      hasClientSecret: !!GOOGLE_CONFIG.CLIENT_SECRET,
    },
  };
}

/**
 * Executa diagnóstico completo
 */
export function runDiagnostics(): void {
  console.log('\n🔍 EXECUTANDO DIAGNÓSTICO DE CONFIGURAÇÕES...\n');

  // 1. Validação básica
  const { valid, errors } = validateConfig();
  console.log(valid ? '✅ Validação básica passou' : '❌ Validação básica falhou');

  if (errors.length > 0) {
    console.log('Erros encontrados:');
    errors.forEach((err) => console.log(`  - ${err}`));
  }

  // 2. Validação avançada
  const validator = new ConfigValidator();
  const result = validator.validate();
  console.log(validator.formatOutput(result));

  // 3. Configurações carregadas
  const envVars = listLoadedEnvVars();
  console.log(`📦 Total de variáveis REACT_APP_* carregadas: ${Object.keys(envVars).length}`);

  // 4. Features ativadas
  const { FEATURES_CONFIG } = require('./environment');
  const enabledFeatures = Object.entries(FEATURES_CONFIG)
    .filter(([key, value]) => key.startsWith('ENABLE_') && value)
    .map(([key]) => key);

  console.log(`\n🎯 Features Ativadas (${enabledFeatures.length}):`);
  enabledFeatures.forEach((feature) => {
    console.log(`  ✓ ${feature}`);
  });

  // 5. Info de debug
  if (ENV.DEBUG) {
    console.log('\n🐛 DEBUG ATIVADO');
    console.log('Configurações para export:');
    console.log(JSON.stringify(exportConfigForDebug(), null, 2));
  }
}

// Executar diagnósticos se for solicitado
if (typeof window === 'undefined' && process.argv.includes('--diagnose')) {
  runDiagnostics();
}

export default {
  ConfigValidator,
  hasConfig,
  listLoadedEnvVars,
  listMissingEnvVars,
  exportConfigForDebug,
  runDiagnostics,
};
