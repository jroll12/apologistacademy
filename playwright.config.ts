import { defineConfig } from '@playwright/test';

const CI = !!process.env.CI;

/** Scripted mode on 5173. The same app with the fake model behind /api on 5174. */
const SCRIPTED = 'http://localhost:5173';
const LIVE = 'http://localhost:5174';

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const desktop = { viewport: { width: 1280, height: 860 } };

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: {
    // Fonts render a little differently from machine to machine.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' },
  },
  use: { baseURL: SCRIPTED, trace: 'retain-on-failure' },
  projects: [
    { name: 'phone', use: phone, testIgnore: ['live.spec.ts'] },
    { name: 'desktop', use: desktop, testIgnore: ['live.spec.ts', 'visual.spec.ts'] },
    { name: 'live', use: { ...phone, baseURL: LIVE }, testMatch: 'live.spec.ts' },
  ],
  webServer: [
    {
      command: 'npx vite --port 5173 --strictPort',
      url: SCRIPTED,
      reuseExistingServer: !CI,
      env: { VITE_FAST: '1' },
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      url: LIVE,
      reuseExistingServer: !CI,
      env: { VITE_FAST: '1', MOCK_AI: '1', LIVE_DAILY_LIMIT: '1000' },
    },
  ],
});
