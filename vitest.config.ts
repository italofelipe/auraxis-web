import { defineVitestConfig } from "@nuxt/test-utils/config";

/**
 * Vitest configuration — auraxis-web
 * Uses defineVitestConfig from @nuxt/test-utils for native Nuxt integration.
 * Docs: https://nuxt.com/docs/getting-started/testing
 */
export default defineVitestConfig({
  test: {
    // Avoids a full Nuxt bootstrap for unit tests.
    // For tests that require the Nuxt runtime, add `// @vitest-environment nuxt` per file.
    environment: "happy-dom",

    // Automatically includes @nuxt/test-utils helpers
    globals: true,

    // Patches happy-dom's localStorage when --localstorage-file receives an
    // invalid path (which causes localStorage.getItem to be undefined).
    setupFiles: ["./vitest.setup.ts"],

    // Test file patterns
    include: [
      "app/**/*.{spec,test}.{ts,tsx}",
      "components/**/*.{spec,test}.{ts,tsx}",
      "app/composables/**/*.{spec,test}.{ts,tsx}",
      "app/stores/**/*.{spec,test}.{ts,tsx}",
      "app/schemas/**/*.{spec,test}.{ts,tsx}",
      "app/utils/**/*.{spec,test}.{ts,tsx}",
      "server/**/*.{spec,test}.{ts,tsx}",
      "__tests__/**/*.{spec,test}.{ts,tsx}",
    ],

    exclude: [
      "**/node_modules/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/e2e/**",  // E2E is handled by Playwright
    ],

    coverage: {
      enabled: true,
      // Fails explicitly when any threshold is not met.
      // Without this flag the report can be generated without blocking execution.
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
      provider: "v8",
      reporter: ["text", "json", "json-summary", "lcovonly", "html"],
      reportsDirectory: "./coverage",

      include: [
        "app/app.vue",
        "app/layouts/**/*.vue",
        "app/components/**/*.vue",
        "app/composables/**/*.ts",
        "app/shared/**/*.ts",
        "app/stores/**/*.ts",
        "app/schemas/**/*.ts",
        "app/utils/**/*.ts",
      ],

      exclude: [
        "**/*.d.ts",
        "**/*.config.{ts,js}",
        "**/node_modules/**",
        "**/.nuxt/**",
        // Plugins require Nuxt runtime — unit-testable helpers are tested via __tests__/plugins/
        "**/app/plugins/**",
        // Pages are covered by Playwright E2E tests, not unit tests.
        // They are imported by spec files which causes v8 to instrument them,
        // but the resulting low coverage is expected and tracked at the E2E level.
        "**/app/pages/**",
        // Frozen/non-core calculation utilities: not yet enabled in MVP.
        // Unit tests will be added when the feature flag is enabled.
        "**/app/utils/calculations/**",
        // Static config files (JSON) are not unit-testable.
        "**/config/**",
      ],
    },
  },
});
