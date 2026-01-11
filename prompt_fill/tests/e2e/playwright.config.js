import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.', // Directory where the tests are located
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: './output/test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:1420', // The Tauri dev server URL
    trace: 'on-first-retry',
    timeout: 60000, // Increase timeout to 60 seconds
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run tauri:dev', // Command to start the dev server
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
