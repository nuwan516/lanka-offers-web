import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.E2E_PORT ?? 5180)

// Uses the machine's installed Microsoft Edge (Chromium) so no browser download
// is required. Set E2E_CHANNEL=chrome to use Chrome instead.
const channel = process.env.E2E_CHANNEL ?? 'msedge'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  // A cold page load plus hydration of a production build can take several seconds on a busy machine.
  timeout: 60_000,
  expect: { timeout: 20_000 },
  workers: process.env.CI ? 2 : 3,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel,
    trace: 'retain-on-failure',
    // Deterministic dates: the fixtures use fixed calendar dates, not "now".
    timezoneId: 'Asia/Colombo',
    locale: 'en-LK',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel, viewport: { width: 1280, height: 900 } },
      grepInvert: /@mobile/,
    },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel }, grep: /@mobile/ },
  ],
  webServer: {
    command: 'node scripts/e2e-server.mjs',
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'pipe',
  },
})
