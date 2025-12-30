/**
 * Retry Utility com Backoff Exponencial
 * Reexecuta operações com atraso progressivo
 */

import logger from './logger';
import errorHandler, { ErrorCategory } from './errorHandler';

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number; // ms
  maxDelay?: number; // ms
  backoffMultiplier?: number;
  onRetry?: (attempt: number, delay: number, error: unknown) => void;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const defaultConfig: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  onRetry: () => {},
  shouldRetry: () => true,
};

/**
 * Executar função com retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<T> {
  const mergedConfig = { ...defaultConfig, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      logger.debug(`Tentativa ${attempt + 1}/${mergedConfig.maxRetries + 1}`, undefined, 'withRetry');
      return await fn();
    } catch (error) {
      lastError = error;

      // Não fazer retry na última tentativa
      if (attempt === mergedConfig.maxRetries) {
        break;
      }

      // Verificar se deve fazer retry
      if (!mergedConfig.shouldRetry(error, attempt)) {
        logger.warn('Erro não retentável', undefined, 'withRetry');
        throw error;
      }

      // Calcular delay
      const delayMs = Math.min(
        mergedConfig.initialDelay * Math.pow(mergedConfig.backoffMultiplier, attempt),
        mergedConfig.maxDelay
      );

      logger.warn(`Retry após ${delayMs}ms - ${String(error)}`, undefined, 'withRetry');

      if (mergedConfig.onRetry) {
        mergedConfig.onRetry(attempt + 1, delayMs, error);
      }

      // Aguardar antes de retentar
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Todos os retries foram esgotados
  const appError = errorHandler.handle(
    lastError,
    ErrorCategory.UNKNOWN,
    {
      retriesExhausted: true,
      maxRetries: mergedConfig.maxRetries,
    }
  );

  throw appError;
}

/**
 * Versão para operações síncronas
 */
export function withRetrySync<T>(
  fn: () => T,
  config?: RetryConfig
): T {
  const mergedConfig = { ...defaultConfig, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      logger.debug(
        `Tentativa síncrona ${attempt + 1}/${mergedConfig.maxRetries + 1}`,
        undefined,
        'withRetrySync'
      );
      return fn();
    } catch (error) {
      lastError = error;

      if (attempt === mergedConfig.maxRetries) {
        break;
      }

      if (!mergedConfig.shouldRetry(error, attempt)) {
        throw error;
      }

      // Para operações síncronas, apenas fazer log
      logger.warn(`Erro síncrono - tentativa ${attempt + 1}`, undefined, 'withRetrySync');
    }
  }

  throw lastError;
}

/**
 * Criar config de retry personalizada para redes instáveis
 */
export function createNetworkRetryConfig(overrides?: Partial<RetryConfig>): RetryConfig {
  return {
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 20000,
    backoffMultiplier: 2.5,
    shouldRetry: (error: unknown) => {
      const errorStr = String(error);
      // Retentar em erros de rede
      return (
        errorStr.includes('network') ||
        errorStr.includes('fetch') ||
        errorStr.includes('timeout') ||
        errorStr.includes('503') ||
        errorStr.includes('502') ||
        errorStr.includes('504')
      );
    },
    ...overrides,
  };
}

/**
 * Criar config de retry para API Google
 */
export function createGoogleRetryConfig(overrides?: Partial<RetryConfig>): RetryConfig {
  return {
    maxRetries: 4,
    initialDelay: 1000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    shouldRetry: (error: unknown) => {
      const errorStr = String(error);
      // Não retentar auth errors ou rate limits permanentes
      if (
        errorStr.includes('401') ||
        errorStr.includes('403') ||
        errorStr.includes('invalid_grant')
      ) {
        return false;
      }
      // Retentar em erros de servidor e timeout
      return (
        errorStr.includes('500') ||
        errorStr.includes('503') ||
        errorStr.includes('timeout') ||
        errorStr.includes('429')
      );
    },
    ...overrides,
  };
}

/**
 * Criar config de retry para banco de dados
 */
export function createDatabaseRetryConfig(overrides?: Partial<RetryConfig>): RetryConfig {
  return {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    shouldRetry: (error: unknown) => {
      const errorStr = String(error);
      // Retentar em conexões e timeouts, mas não em erros de sintaxe
      return (
        errorStr.includes('connection') ||
        errorStr.includes('timeout') ||
        errorStr.includes('busy') ||
        !errorStr.includes('syntax')
      );
    },
    ...overrides,
  };
}

/**
 * Hook React para retries com estado de carregamento
 */
export function useRetry() {
  return {
    withRetry,
    createNetworkRetryConfig,
    createGoogleRetryConfig,
    createDatabaseRetryConfig,
  };
}
