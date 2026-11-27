/**
 * @file Vite 构建与开发代理配置
 * @author ypc
 */

import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#test': fileURLToPath(new URL('./test', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3456',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:3456',
        ws: true,
      },
    },
  },
});
