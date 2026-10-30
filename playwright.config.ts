import { defineConfig } from '@playwright/test';

// E2E runs against the web export; the phone app shares every screen and all the logic with it.
// It uses live services (Open-Meteo, OSRM, NASA GIBS), so it needs internet.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8765',
    viewport: { width: 412, height: 915 },
    channel: 'chrome',
    locale: 'es-EC',
    timezoneId: 'America/Guayaquil',
  },
  webServer: {
    command: 'npx expo export --platform web --output-dir dist-e2e && node e2e/serve.mjs dist-e2e',
    url: 'http://127.0.0.1:8765',
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
