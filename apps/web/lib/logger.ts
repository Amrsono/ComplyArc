/**
 * Structured logger utility for ComplyArc frontend
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private log(level: LogLevel, context: string, message: string, data?: unknown) {
    if (!this.isDevelopment && level === 'debug') {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...(data !== undefined ? { data } : {}),
    };

    if (level === 'error') {
      console.error(`[${entry.timestamp}] [${context}] ERROR: ${message}`, data ?? '');
    } else if (level === 'warn') {
      console.warn(`[${entry.timestamp}] [${context}] WARN: ${message}`, data ?? '');
    } else if (this.isDevelopment) {
      console.log(`[${entry.timestamp}] [${context}] ${level.toUpperCase()}: ${message}`, data ?? '');
    }
  }

  debug(context: string, message: string, data?: unknown) {
    this.log('debug', context, message, data);
  }

  info(context: string, message: string, data?: unknown) {
    this.log('info', context, message, data);
  }

  warn(context: string, message: string, data?: unknown) {
    this.log('warn', context, message, data);
  }

  error(context: string, message: string, data?: unknown) {
    this.log('error', context, message, data);
  }
}

export const logger = new Logger();
export default logger;
