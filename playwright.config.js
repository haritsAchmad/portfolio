import { defineConfig, devices } from '@playwright/test'
import { TEST_WEB3FORMS_ACCESS_KEY } from './tests/security/test-env.js'

export default defineConfig({
  testDir: './tests/security',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['./tests/security/security-reporter.js'],
    ['html', { outputFolder: 'test-results/security/html', open: 'never' }],
  ],
  outputDir: 'test-results/security/artifacts',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    // Headless Firefox renders and records video in software. With six browsers
    // recording at once, Firefox sometimes stalled for 30s in setViewportSize,
    // goto, or context close (never in a test body) and passed when run alone.
    // Limiting Firefox to two concurrent workers removed those stalls in
    // repeated full runs; the other projects keep the global worker count.
    { name: 'firefox-desktop', workers: 2, use: { ...devices['Desktop Firefox'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
    // The test build gets a placeholder key instead of any real key from
    // .env.local or the shell (see tests/security/test-env.js).
    env: { VITE_WEB3FORMS_ACCESS_KEY: TEST_WEB3FORMS_ACCESS_KEY },
  },
})
