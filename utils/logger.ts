/**
 * Logger Centralizado com Múltiplos Níveis
 * Fornece logging estruturado com stack trace e contexto
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  module?: string;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enableConsole = true;
  private enableRemote = process.env.VITE_ENABLE_REMOTE_LOGGING === 'true';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sessionId = this.generateSessionId();

  constructor() {
    this.setupGlobalErrorHandler();
  }

  /**
   * Log nível DEBUG
   */
  debug(message: string, context?: Record<string, any>, module?: string): void {
    this.log(LogLevel.DEBUG, message, context, module);
  }

  /**
   * Log nível INFO
   */
  info(message: string, context?: Record<string, any>, module?: string): void {
    this.log(LogLevel.INFO, message, context, module);
  }

  /**
   * Log nível WARNING
   */
  warn(message: string, context?: Record<string, any>, module?: string): void {
    this.log(LogLevel.WARN, message, context, module);
  }

  /**
   * Log nível ERROR
   */
  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>,
    module?: string
  ): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, module);

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (typeof error === 'string') {
      entry.error = {
        name: 'Unknown',
        message: error,
      };
    }

    this.log(LogLevel.ERROR, message, context, module, entry);
  }

  /**
   * Log nível CRITICAL
   */
  critical(
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>,
    module?: string
  ): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, module);

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    this.log(LogLevel.CRITICAL, message, context, module, entry);

    // Enviar para monitoramento remoto em produção
    if (!this.isDevelopment && this.enableRemote) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Log genérico
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    module?: string,
    entry?: LogEntry
  ): void {
    const logEntry = entry || this.createLogEntry(level, message, context, module);

    // Armazenar
    this.storeLog(logEntry);

    // Exibir no console
    if (this.enableConsole && this.isDevelopment) {
      this.logToConsole(logEntry);
    }

    // Enviar para backend se necessário
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      this.sendToBackend(logEntry);
    }
  }

  /**
   * Criar entrada de log
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    module?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      module,
      sessionId: this.sessionId,
      userId: this.getUserId(),
    };
  }

  /**
   * Exibir no console com cores
   */
  private logToConsole(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: 'color: #888; font-weight: normal;',
      [LogLevel.INFO]: 'color: #2196F3; font-weight: bold;',
      [LogLevel.WARN]: 'color: #FF9800; font-weight: bold;',
      [LogLevel.ERROR]: 'color: #F44336; font-weight: bold;',
      [LogLevel.CRITICAL]: 'color: #800000; font-weight: bold; font-size: 14px;',
    };

    const prefix = `%c[${entry.level}${entry.module ? ` - ${entry.module}` : ''}]`;
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();

    console.log(`${prefix} ${timestamp}: ${entry.message}`, colors[entry.level]);

    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('  Context:', entry.context);
    }

    if (entry.error) {
      console.error('  Error:', entry.error.message);
      if (entry.error.stack && this.isDevelopment) {
        console.error('  Stack:', entry.error.stack);
      }
    }
  }

  /**
   * Armazenar log em memória
   */
  private storeLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Manter apenas últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Salvar em localStorage
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs.slice(-100)));
    } catch (error) {
      console.warn('Não foi possível salvar logs no localStorage');
    }
  }

  /**
   * Enviar para backend
   */
  private async sendToBackend(entry: LogEntry): Promise<void> {
    try {
      const backendUrl = process.env.VITE_API_URL;
      if (!backendUrl) return;

      await fetch(`${backendUrl}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.warn('Erro ao enviar log para backend:', error);
    }
  }

  /**
   * Enviar para serviço de monitoramento remoto
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    try {
      const remoteUrl = process.env.VITE_SENTRY_DSN;
      if (!remoteUrl) return;

      await fetch(remoteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.warn('Erro ao enviar para serviço remoto:', error);
    }
  }

  /**
   * Obter todos os logs
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Limpar logs
   */
  clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem('app_logs');
    } catch (error) {
      console.warn('Erro ao limpar logs do localStorage');
    }
  }

  /**
   * Exportar logs para download
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Setup de handler global de erros
   */
  private setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      this.error('Erro não tratado (window.error)', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('Promise rejection não tratado', event.reason, {
        promise: event.promise,
      });
    });
  }

  /**
   * Gerar session ID único
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obter ID do usuário (se disponível)
   */
  private getUserId(): string | undefined {
    try {
      const user = localStorage.getItem('current_user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.id || parsed.email;
      }
    } catch (error) {
      // Ignorar erros ao tentar obter user ID
    }
    return undefined;
  }

  /**
   * Habilitar/desabilitar console
   */
  setConsoleEnabled(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  /**
   * Obter estatísticas de logs
   */
  getStats(): Record<LogLevel, number> {
    const stats = {} as Record<LogLevel, number>;

    Object.values(LogLevel).forEach((level) => {
      stats[level] = this.logs.filter((log) => log.level === level).length;
    });

    return stats;
  }
}

// Singleton
const logger = new Logger();
export default logger;
