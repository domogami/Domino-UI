import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results/development",
  testMatch: "**/*.spec.ts",
  testIgnore: "**/production-styles.spec.ts",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 7_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    channel: existsSync("/Applications/Google Chrome.app")
      ? "chrome"
      : undefined,
    headless: true,
    actionTimeout: 10_000,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "off",
  },
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
