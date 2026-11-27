import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#test': fileURLToPath(new URL('./test', import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/unit/**/*.unit.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts', './test/setup.integration.ts'],
          include: ['test/integration/**/*.integration.test.tsx'],
        },
      },
      {
        test: {
          name: 'vrt',
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [
              { browser: 'chromium', name: 'desktop', viewport: { width: 1440, height: 900 } },
              { browser: 'chromium', name: 'mobile', viewport: { width: 390, height: 844 } },
            ],
          },
          include: ['test/vrt/**/*.vrt.test.tsx'],
        },
      },
    ],
  },
});
