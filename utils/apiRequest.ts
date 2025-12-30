/**
 * API Request Middleware
 * Wrapper para requisições com logging, retry, e tratamento de erro
 */

import logger from './logger';
import errorHandler, { ErrorCategory } from './errorHandler';
import { withRetry, createNetworkRetryConfig } from './retry';

export interface ApiRequestConfig extends RequestInit {
  timeout?: number;
  retryable?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  timestamp: string;
}

/**
 * Fazer requisição HTTP com logging e retry automático
 */
export async function apiRequest<T = any>(
  url: string,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  const {
    timeout = 30000,
    retryable = true,
    logLevel = 'info',
    ...fetchConfig
  } = config || {};

  const startTime = performance.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const method = config?.method || 'GET';

  logger[logLevel as any](
    `[${requestId}] ${method} ${url}`,
    {
      method,
      url,
      headers: fetchConfig.headers,
      timeout,
      retryable,
    },
    'ApiRequest'
  );

  try {
    // Implementar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Fazer requisição com retry se configurado
    const fetchFn = async () => {
      return await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
      });
    };

    const response = retryable
      ? await withRetry(fetchFn, createNetworkRetryConfig())
      : await fetchFn();

    clearTimeout(timeoutId);

    const duration = performance.now() - startTime;

    // Parse resposta
    let data: T | undefined;
    let contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as any;
    }

    // Log de sucesso
    if (response.ok) {
      logger[logLevel as any](
        `[${requestId}] ✓ ${method} ${url} (${response.status}) em ${duration.toFixed(0)}ms`,
        {
          requestId,
          status: response.status,
          duration,
        },
        'ApiRequest'
      );

      return {
        success: true,
        data,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Status não-2xx
      const errorMessage = `HTTP ${response.status}`;
      logger.warn(
        `[${requestId}] ✗ ${method} ${url} (${response.status}) em ${duration.toFixed(0)}ms`,
        {
          requestId,
          status: response.status,
          duration,
          data,
        },
        'ApiRequest'
      );

      const appError = errorHandler.handle(
        new Error(errorMessage),
        this.categorizeHttpStatus(response.status),
        {
          requestId,
          url,
          method,
          status: response.status,
          data,
          duration,
        }
      );

      return {
        success: false,
        error: appError.userMessage,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error: unknown) {
    const duration = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(
      `[${requestId}] ✗✗ ${method} ${url} - ${errorMessage} em ${duration.toFixed(0)}ms`,
      error,
      {
        requestId,
        url,
        method,
        duration,
      },
      'ApiRequest'
    );

    const category = this.categorizeError(error);
    const appError = errorHandler.handle(error, category, {
      requestId,
      url,
      method,
      duration,
    });

    return {
      success: false,
      error: appError.userMessage,
      status: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Categorizar status HTTP
 */
function categorizeHttpStatus(status: number): ErrorCategory {
  if (status === 401) return ErrorCategory.AUTH;
  if (status === 403) return ErrorCategory.PERMISSION;
  if (status === 404) return ErrorCategory.NOT_FOUND;
  if (status >= 500) return ErrorCategory.SERVER;
  return ErrorCategory.NETWORK;
}

/**
 * Categorizar erro
 */
function categorizeError(error: unknown): ErrorCategory {
  const errorStr = String(error);

  if (errorStr.includes('auth')) return ErrorCategory.AUTH;
  if (errorStr.includes('network') || errorStr.includes('fetch')) return ErrorCategory.NETWORK;
  if (errorStr.includes('validation')) return ErrorCategory.VALIDATION;
  if (errorStr.includes('404')) return ErrorCategory.NOT_FOUND;
  if (errorStr.includes('403')) return ErrorCategory.PERMISSION;

  return ErrorCategory.UNKNOWN;
}

/**
 * Helper para GET request
 */
export async function apiGet<T = any>(
  url: string,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...config, method: 'GET' });
}

/**
 * Helper para POST request
 */
export async function apiPost<T = any>(
  url: string,
  body?: any,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    ...config,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Helper para PUT request
 */
export async function apiPut<T = any>(
  url: string,
  body?: any,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    ...config,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...config?.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Helper para DELETE request
 */
export async function apiDelete<T = any>(
  url: string,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { ...config, method: 'DELETE' });
}
