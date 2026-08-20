import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../components/ui/Toast';

function ToastTrigger() {
  const { success, error, toast } = useToast();
  return (
    <div>
      <button onClick={() => success('Client created successfully!')}>Trigger Success</button>
      <button onClick={() => error('Sanctions check failed!')}>Trigger Error</button>
      <button onClick={() => toast('Informational alert', 'info')}>Trigger Info</button>
    </div>
  );
}

describe('Toast UI Notification Component Tests', () => {
  it('should render success toast with checkmark indicator', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger Success'));
    expect(screen.getByText(/Client created successfully!/i)).toBeInTheDocument();
  });

  it('should render error toast with cross indicator', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByText(/Sanctions check failed!/i)).toBeInTheDocument();
  });
});
