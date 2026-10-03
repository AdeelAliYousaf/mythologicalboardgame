import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/geometry',
  timeout: 120_000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3100', browserName: 'chromium', channel: 'msedge', serviceWorkers: 'block' },
  webServer: {
    command: 'npm start -- --port 3100',
    url: 'http://127.0.0.1:3100/test-board',
    env: { BOARD_GEOMETRY_TESTING: '1' },
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
