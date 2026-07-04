/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// The shared `.env` lives at the repo root and is consumed by both apps.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

// Resolve the workspace packages to their TypeScript source. Vite compiles TS
// natively, so the web bundle gets real ESM (no CommonJS-interop issues) and
// hot-reloads when a shared package changes. The API consumes the built CJS.
const pkg = (name: string) =>
  fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  envDir: repoRoot,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@matal/shared-types': pkg('shared-types'),
      '@matal/validation': pkg('validation'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
