import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react() as any],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./apps/web/vitest.setup.ts'],
    include: ['apps/web/tests/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['apps/web/app/**', 'apps/web/components/**', 'apps/web/lib/**'],
      exclude: ['**/*.d.ts', 'vitest.*.ts', 'apps/web/app/**/components/**'],
      thresholds: {
        lines: 70,
        functions: 65,
        branches: 55,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web'),
    },
  },
});
