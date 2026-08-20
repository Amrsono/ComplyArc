import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, useTranslation } from '../lib/i18n';

function TestConsumer() {
  const { t, language, setLanguage, isRtl } = useTranslation();
  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      <span data-testid="is-rtl">{isRtl ? 'RTL' : 'LTR'}</span>
      <h1 data-testid="nav-dashboard">{t('nav.dashboard')}</h1>
      <button data-testid="switch-ar" onClick={() => setLanguage('ar')}>
        Arabic
      </button>
      <button data-testid="switch-en" onClick={() => setLanguage('en')}>
        English
      </button>
    </div>
  );
}

describe('i18n Internationalization Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
  });

  it('should render default English translations', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(screen.getByTestId('is-rtl')).toHaveTextContent('LTR');
    expect(screen.getByTestId('nav-dashboard')).toHaveTextContent('Dashboard');
  });

  it('should switch to Arabic with RTL direction', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    const switchBtn = screen.getByTestId('switch-ar');
    fireEvent.click(switchBtn);

    expect(screen.getByTestId('current-lang')).toHaveTextContent('ar');
    expect(screen.getByTestId('is-rtl')).toHaveTextContent('RTL');
    expect(screen.getByTestId('nav-dashboard')).toHaveTextContent('لوحة القيادة');
    expect(localStorage.getItem('complyarc_lang')).toBe('ar');
  });
});
