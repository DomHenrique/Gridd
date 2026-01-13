/**
 * Serviço de Logger
 * Centraliza todos os logs com contexto e níveis
 */

import { getApiUrl } from '../../config/env';

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 100;
  private isDevelopment = import.meta.env.MODE === 'development';

  /**
   * Log de Informação
   */
  info(message: string, context?: any): void {
    this.log('info', message, context);
  }

  /**
   * Log de Sucesso
   */
  success(message: string, context?: any): void {
    this.log('success', message, context);
  }

  /**
   * Log de Aviso
   */
  warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  /**
   * Log de Erro
   */
  error(message: string, context?: any): void {
    this.log('error', message, context);
  }

  /**
   * Log de Debug
   */
  debug(message: string, context?: any): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * Método privado de logging
   */
  private log(level: LogLevel, message: string, context?: any): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp,
    };

    // Adicionar ao histórico
    this.logs.push(entry);

    // Limitar quantidade de logs armazenados
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Imprimir no console
    this.printToConsole(level, message, context, timestamp);

    // Enviar para backend se for erro crítico
    if (level === 'error') {
      this.sendToBackend(entry);
    }
  }

  /**
   * Imprime no console com cor apropriada
   */
  private printToConsole(
    level: LogLevel,
    message: string,
    context: any,
    timestamp: string
  ): void {
    const prefix = `[${timestamp}]`;
    const style = this.getConsoleStyle(level);

    if (context) {
      console.log(`%c${prefix} ${message}`, style, context);
    } else {
      console.log(`%c${prefix} ${message}`, style);
    }
  }

  /**
   * Retorna estilo do console baseado no nível
   */
  private getConsoleStyle(level: LogLevel): string {
    const styles: { [key in LogLevel]: string } = {
      info: 'color: #0066cc; font-weight: bold;',
      success: 'color: #00aa00; font-weight: bold;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold;',
      debug: 'color: #999999; font-weight: bold;',
    };

    return styles[level];
  }

  /**
   * Envia log de erro para o backend
   */
  private sendToBackend(entry: LogEntry): void {
    try {
      // Aqui você pode enviar para um serviço de logging como Sentry, LogRocket, etc
      // Desativado por enquanto para evitar erros 405 (Method Not Allowed) no console
      /*
      const apiUrl = getApiUrl();

      fetch(`${apiUrl}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Silenciosamente falha se não conseguir enviar
      });
      */
    } catch (error) {
      // Não lançar erro durante logging
    }
  }

  /**
   * Retorna todos os logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Retorna logs filtrados por nível
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Limpa todos os logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Exporta logs como JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Exporta logs como CSV
   */
  exportLogsAsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Message', 'Context'];
    const rows = this.logs.map((log) => [
      log.timestamp,
      log.level,
      log.message,
      JSON.stringify(log.context || ''),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Retorna estatísticas de logs
   */
  getStats(): {
    total: number;
    byLevel: { [key in LogLevel]: number };
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        info: 0,
        success: 0,
        warn: 0,
        error: 0,
        debug: 0,
      },
    };

    this.logs.forEach((log) => {
      stats.byLevel[log.level]++;
    });

    return stats;
  }
}

// Singleton
const logger = new LoggerService();

export { logger, LoggerService, type LogEntry, type LogLevel };
