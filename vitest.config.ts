import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    // Keep unit specs isolated from Playwright e2e tests so each runner sees only its own files.
    include: [
      "tests/unit/**/*.spec.ts",
      "tests/unit/**/*.spec.tsx",
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
    ],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    // Unit tests exercise UI components, so run under jsdom with RTL matchers enabled.
    environment: "jsdom",
    setupFiles: ["tests/unit/setup.ts"],
  },
});
