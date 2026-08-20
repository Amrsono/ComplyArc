import { describe, it, expect } from 'vitest';
import { sentry } from '../lib/sentry';

describe('Sentry Client Unit Tests', () => {
  it('should initialize with no-op fallback when DSN is not set', () => {
    sentry.init({ dsn: '' });
    expect(sentry.isEnabled()).toBe(false);

    const eventId = sentry.captureException(new Error('Sample test error'));
    expect(eventId).toBeNull();

    const msgId = sentry.captureMessage('Sample message');
    expect(msgId).toBeNull();
  });

  it('should capture exceptions and messages when valid DSN is provided', () => {
    sentry.init({ dsn: 'https://mock-public-key@o0.ingest.sentry.io/0000000' });
    expect(sentry.isEnabled()).toBe(true);

    const eventId = sentry.captureException(new Error('Runtime crash in risk pipeline'), {
      client_id: 'c-100',
    });
    expect(eventId).toBeDefined();
    expect(typeof eventId).toBe('string');
    expect(eventId?.startsWith('err_')).toBe(true);

    const msgId = sentry.captureMessage('High severity sanctions hit detected', 'warning');
    expect(msgId).toBeDefined();
    expect(msgId?.startsWith('msg_')).toBe(true);
  });
});
