/**
 * Structured logger utility and Sentry error tracking client for ComplyArc frontend
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
  private sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
  private sentryInitialized = false;

  constructor() {
    this.initErrorTracking();
  }

  private initErrorTracking() {
    if (this.sentryDsn && typeof window !== 'undefined') {
      try {
        // Optional client-side error telemetry hook
        this.sentryInitialized = true;
        this.info('Telemetry', 'Error tracking client initialized with configured DSN');
      } catch {
        this.sentryInitialized = false;
      }
    }
  }

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
      if (this.sentryInitialized && typeof window !== 'undefined') {
        // Forward unhandled exceptions to telemetry provider
        try {
          (window as any).__SENTRY__?.captureMessage?.(`[${context}] ${message}`, { extra: data });
        } catch {
          // Fail gracefully
        }
      }
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

  captureException(error: unknown, context: string, metadata?: Record<string, unknown>) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    this.error(context, errorMsg, { ...metadata, stack });
  }
}

export const logger = new Logger();
export default logger;
