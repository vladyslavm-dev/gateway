import { defineConfig, devices } from "@playwright/test";

const ciChrome = process.env.CI ? { channel: "chrome" as const } : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3200",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...ciChrome,
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        ...ciChrome,
      },
    },
  ],
});
