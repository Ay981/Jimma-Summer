import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/videos',
  timeout: 600_000,
  use: {
    baseURL: 'http://localhost:8000',
    video: { mode: 'on', size: { width: 390, height: 844 } },
    launchOptions: {
      slowMo: 300,
    },
  },
  projects: [
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 14'],
        browserName: 'chromium',
      },
    },
  ],
  outputDir: './tests/video-output',
});
