import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 180000,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://localhost:8081',
    viewport: { width: 393, height: 852 },
    timezoneId: 'Asia/Manila',
    colorScheme: 'light',
    navigationTimeout: 60000,
    actionTimeout: 15000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--no-sandbox'] },
  },
  webServer: {
    command: 'npm run web -- --localhost --port 8081 --clear',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: { CI: '1' },
  },
});
