/**
 * Tratador Centralizado de Erros
 * Categoriza, transforma e processa erros com estratégias de recuperação
 */

import logger, { LogLevel } from './logger';

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  SERVER = 'SERVER',
  DATABASE = 'DATABASE',
  GOOGLE_PHOTOS = 'GOOGLE_PHOTOS',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  originalError?: Error | unknown;
  context?: Record<string, any>;
  timestamp: string;
  retryable: boolean;
  suggestedAction?: string;
}

class ErrorHandler {
  private errorListeners: ((error: AppError) => void)[] = [];
  private errorLog: AppError[] = [];
  private maxErrorsStored = 100;

  /**
   * Processar erro e retornar estrutura padronizada
   */
  handle(
    error: Error | string | unknown,
    category?: ErrorCategory,
    context?: Record<string, any>
  ): AppError {
    const appError = this.categorizeError(error, category, context);

    // Armazenar
    this.storeError(appError);

    // Logger apropriado
    const logModule = `ErrorHandler:${appError.category}`;
    if (appError.severity === ErrorSeverity.CRITICAL) {
      logger.critical(appError.message, error, context, logModule);
    } else if (appError.severity === ErrorSeverity.HIGH) {
      logger.error(appError.message, error, context, logModule);
    } else {
      logger.warn(appError.message, context, logModule);
    }

    // Notificar listeners
    this.notifyListeners(appError);

    return appError;
  }

  /**
   * Categorizar erro baseado em tipo e conteúdo
   */
  private categorizeError(
    error: Error | string | unknown,
    category?: ErrorCategory,
    context?: Record<string, any>
  ): AppError {
    const timestamp = new Date().toISOString();
    const id = this.generateErrorId();

    // Se categoria foi explicitamente fornecida
    if (category) {
      return this.createError(id, category, error, timestamp, context);
    }

    // Tentar inferir categoria do erro
    if (error instanceof Error) {
      if (error.name === 'GooglePhotosApiException') {
        return this.createError(id, ErrorCategory.GOOGLE_PHOTOS, error, timestamp, context);
      }

      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        return this.createError(id, ErrorCategory.AUTH, error, timestamp, context);
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        return this.createError(id, ErrorCategory.NETWORK, error, timestamp, context);
      }

      if (error.message.includes('validation')) {
        return this.createError(id, ErrorCategory.VALIDATION, error, timestamp, context);
      }

      if (error.message.includes('404') || error.message.includes('not found')) {
        return this.createError(id, ErrorCategory.NOT_FOUND, error, timestamp, context);
      }

      if (error.message.includes('403') || error.message.includes('permission')) {
        return this.createError(id, ErrorCategory.PERMISSION, error, timestamp, context);
      }

      if (error.message.includes('database') || error.message.includes('db')) {
        return this.createError(id, ErrorCategory.DATABASE, error, timestamp, context);
      }

      if (error.message.includes('500') || error.message.includes('server')) {
        return this.createError(id, ErrorCategory.SERVER, error, timestamp, context);
      }
    }

    // Fallback
    return this.createError(id, ErrorCategory.UNKNOWN, error, timestamp, context);
  }

  /**
   * Criar estrutura de erro
   */
  private createError(
    id: string,
    category: ErrorCategory,
    error: Error | string | unknown,
    timestamp: string,
    context?: Record<string, any>
  ): AppError {
    const { severity, retryable, userMessage, suggestedAction } =
      this.getSeverityAndRecovery(category, error);

    const message = error instanceof Error ? error.message : String(error);

    return {
      id,
      category,
      severity,
      message,
      userMessage,
      originalError: error,
      context,
      timestamp,
      retryable,
      suggestedAction,
    };
  }

  /**
   * Determinar severidade e estratégia de recuperação
   */
  private getSeverityAndRecovery(
    category: ErrorCategory,
    error: Error | string | unknown
  ): {
    severity: ErrorSeverity;
    retryable: boolean;
    userMessage: string;
    suggestedAction?: string;
  } {
    const errorStr = error instanceof Error ? error.message : String(error);

    switch (category) {
      case ErrorCategory.NETWORK:
        return {
          severity: ErrorSeverity.HIGH,
          retryable: true,
          userMessage: 'Problema de conexão. Verificando sua internet...',
          suggestedAction: 'Verificar conexão e tentar novamente',
        };

      case ErrorCategory.AUTH:
        return {
          severity: ErrorSeverity.HIGH,
          retryable: false,
          userMessage: 'Sessão expirada. Por favor, faça login novamente.',
          suggestedAction: 'Realizar login novamente',
        };

      case ErrorCategory.VALIDATION:
        return {
          severity: ErrorSeverity.LOW,
          retryable: false,
          userMessage: 'Dados inválidos. Verifique e tente novamente.',
          suggestedAction: 'Corrigir dados do formulário',
        };

      case ErrorCategory.NOT_FOUND:
        return {
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          userMessage: 'Recurso não encontrado.',
          suggestedAction: 'Voltar e tentar novamente',
        };

      case ErrorCategory.PERMISSION:
        return {
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          userMessage: 'Você não tem permissão para acessar isto.',
          suggestedAction: 'Solicitar acesso ao administrador',
        };

      case ErrorCategory.SERVER:
        return {
          severity: ErrorSeverity.HIGH,
          retryable: true,
          userMessage: 'Servidor indisponível. Tentando novamente...',
          suggestedAction: 'Tentar mais tarde',
        };

      case ErrorCategory.DATABASE:
        return {
          severity: ErrorSeverity.CRITICAL,
          retryable: true,
          userMessage: 'Problema com o banco de dados. Tentando recuperar...',
          suggestedAction: 'Contactar suporte técnico',
        };

      case ErrorCategory.GOOGLE_PHOTOS:
        return {
          severity: this.getGooglePhotosErrorSeverity(errorStr),
          retryable: this.isGooglePhotosRetryable(errorStr),
          userMessage: 'Problema ao acessar Google Photos. Tente novamente.',
          suggestedAction: 'Verificar permissões do Google Photos',
        };

      default:
        return {
          severity: ErrorSeverity.MEDIUM,
          retryable: true,
          userMessage: 'Algo deu errado. Tentando recuperar...',
          suggestedAction: 'Recarregar a página',
        };
    }
  }

  /**
   * Determinar severidade de erro Google Photos
   */
  private getGooglePhotosErrorSeverity(error: string): ErrorSeverity {
    if (error.includes('401') || error.includes('403')) {
      return ErrorSeverity.HIGH;
    }
    if (error.includes('500') || error.includes('503')) {
      return ErrorSeverity.CRITICAL;
    }
    return ErrorSeverity.MEDIUM;
  }

  /**
   * Verificar se erro Google Photos é retentável
   */
  private isGooglePhotosRetryable(error: string): boolean {
    return (
      !error.includes('401') &&
      !error.includes('403') &&
      !error.includes('404') &&
      !error.includes('invalid_grant')
    );
  }

  /**
   * Registrar listener para erros
   */
  onError(callback: (error: AppError) => void): () => void {
    this.errorListeners.push(callback);

    // Retornar unsubscribe function
    return () => {
      this.errorListeners = this.errorListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notificar todos os listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach((callback) => {
      try {
        callback(error);
      } catch (listenerError) {
        console.error('Erro no listener de erro:', listenerError);
      }
    });
  }

  /**
   * Armazenar erro no histórico
   */
  private storeError(error: AppError): void {
    this.errorLog.push(error);

    if (this.errorLog.length > this.maxErrorsStored) {
      this.errorLog = this.errorLog.slice(-this.maxErrorsStored);
    }
  }

  /**
   * Obter erros recentes
   */
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Obter erros por categoria
   */
  getErrorsByCategory(category: ErrorCategory): AppError[] {
    return this.errorLog.filter((error) => error.category === category);
  }

  /**
   * Limpar histórico de erros
   */
  clearErrorHistory(): void {
    this.errorLog = [];
  }

  /**
   * Gerar ID único para erro
   */
  private generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Converter AppError para string legível
   */
  toString(error: AppError): string {
    return `[${error.id}] ${error.category}: ${error.userMessage} (${error.severity})`;
  }
}

// Singleton
const errorHandler = new ErrorHandler();
export default errorHandler;
