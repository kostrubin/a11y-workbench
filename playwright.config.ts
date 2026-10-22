import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 6000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'off', video: 'off', screenshot: 'off', serviceWorkers: 'block' },
  webServer: { command: 'npm run preview', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 20_000 },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { chromiumSandbox: true } } },
    { name: 'firefox', testMatch: /(?:patterns|smoke)\.spec\.ts/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: /(?:patterns|smoke)\.spec\.ts/, use: { ...devices['Desktop Safari'] } }
  ]
});
