import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices, webkit } from "@playwright/test";

// Use an already installed local WebKit when Playwright's package revision has
// moved ahead of the cached browser. CI uses its normal installed executable.
const cache = join(homedir(), "Library/Caches/ms-playwright");
const cachedWebKit =
  process.platform === "darwin" && existsSync(cache)
    ? readdirSync(cache)
        .filter((entry) => /^webkit-\d+$/.test(entry))
        .sort((a, b) => Number(b.slice(7)) - Number(a.slice(7)))
        .map((entry) => join(cache, entry, "pw_run.sh"))
        .find(existsSync)
    : undefined;
const webkitExecutable = existsSync(webkit.executablePath())
  ? undefined
  : cachedWebKit;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results/production",
  testMatch: "production-styles.spec.ts",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 7_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4174",
    headless: true,
    reducedMotion: "no-preference",
    actionTimeout: 10_000,
    trace: "retain-on-failure",
    screenshot: "off",
  },
  projects: [
    {
      name: "production-mobile-chrome",
      use: {
        browserName: "chromium",
        channel: existsSync("/Applications/Google Chrome.app")
          ? "chrome"
          : undefined,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "production-mobile-webkit",
      use: {
        ...devices["iPhone 13"],
        browserName: "webkit",
        reducedMotion: "no-preference",
        launchOptions: webkitExecutable
          ? { executablePath: webkitExecutable }
          : undefined,
      },
    },
  ],
  webServer: {
    command: "npm run preview -- --port 4174 --strictPort",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
