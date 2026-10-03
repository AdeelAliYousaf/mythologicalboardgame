import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir: './tests/mobile', timeout: 30_000, workers: 1,
 use: { baseURL: 'http://127.0.0.1:3100', browserName: 'chromium', channel: 'msedge', serviceWorkers: 'block', reducedMotion: 'reduce' },
 webServer: { command: 'npm start -- --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: true, timeout: 60_000 },
});
