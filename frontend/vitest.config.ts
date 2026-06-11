import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "playwright-report/**", "test-results/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/app/**/*.tsx",
        "src/app/**/*.ts",
        "src/components/projects/projects-graph-island.tsx",
        "src/components/world/**/*.tsx",
        "src/lib/motion/scroll.ts",
        "src/lib/site-config.ts",
      ],
      thresholds: {
        statements: 65,
        lines: 65,
        functions: 65,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
