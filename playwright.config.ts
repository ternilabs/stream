import { defineConfig, devices } from '@playwright/test';

// claude-opus-5: Specs run against captured fixtures by default so that geometry assertions
// (the layout-shift guard) have stable data to measure. E2E_LIVE=1 runs the same specs against
// the real API; data-specific assertions opt out there via `fixtureOnly()`.
const IS_LIVE = process.env.E2E_LIVE === '1';
const PORT = 5174;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  expect: { timeout: 7_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /responsive\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile',
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    // claude-opus-5: Serves the production build rather than the dev server. It exercises what
    // actually ships, and it needs no file watchers — `vite dev` fails with ENOSPC on machines
    // whose inotify watch limit is already consumed by an editor.
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // The mock intercepts every /v1/** request, so in fixture mode this only has to be a
      // well-formed absolute origin.
      VITE_API_BASE_URL: IS_LIVE ? 'https://stream-api.ternilabs.xyz' : 'https://stream-api.test',
    },
  },
});
