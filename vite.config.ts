import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Project page served at https://<user>.github.io/schedule-life/, so built asset
// URLs must be prefixed with the repo name. Dev keeps serving from root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/schedule-life/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}));
