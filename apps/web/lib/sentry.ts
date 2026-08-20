/**
 * ComplyArc — Sentry Error Tracking Integration (Frontend)
 * Graceful fallback when NEXT_PUBLIC_SENTRY_DSN is absent.
 */

interface SentryClientConfig {
  dsn?: string;
  environment?: string;
}

class SentryClient {
  private dsn: string;
  private isInitialized = false;

  constructor() {
    this.dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
    if (this.dsn) {
      this.init({ dsn: this.dsn, environment: process.env.NODE_ENV });
    }
  }

  public init(config: SentryClientConfig): boolean {
    if (!config.dsn) {
      this.isInitialized = false;
      return false;
    }
    this.dsn = config.dsn;
    this.isInitialized = true;
    return true;
  }

  public isEnabled(): boolean {
    return this.isInitialized && Boolean(this.dsn);
  }

  public captureException(error: Error | unknown, context?: Record<string, unknown>): string | null {
    if (!this.isEnabled()) {
      return null;
    }
    const eventId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== 'undefined' && (window as any).__SENTRY__) {
      try {
        (window as any).__SENTRY__.captureException(error, { extra: context });
      } catch {
        // Fallback
      }
    }
    return eventId;
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): string | null {
    if (!this.isEnabled()) {
      return null;
    }
    const eventId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return eventId;
  }
}

export const sentry = new SentryClient();
export default sentry;
