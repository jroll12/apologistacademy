/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apiDevPlugin } from './server/devPlugin';

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    environmentMatchGlobs: [['src/**/*.test.tsx', 'jsdom']],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
