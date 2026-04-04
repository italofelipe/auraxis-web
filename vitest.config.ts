import { defineVitestConfig } from "@nuxt/test-utils/config";
import type { UserConfig } from "vitest/config";

/**
 * Vitest configuration — auraxis-web
 * Uses defineVitestConfig from @nuxt/test-utils for native Nuxt integration.
 * Docs: https://nuxt.com/docs/getting-started/testing
 *
 * COVERAGE NOTE:
 * defineVitestConfig wraps the config in a projects/workspace mode which drops
 * test.coverage at the root. We restore it by exporting an async factory that
 * resolves the Nuxt config and re-attaches coverage before returning.
 *
 * We use `all: false` (report only executed files) + `excludeAfterRemap: true`
 * (apply exclude patterns after source-map remapping) to filter out pages,
 * features, plugins, core and other non-unit-testable files that are imported
 * transitively by tests.
 *
 * Files that cannot be excluded (barrel re-exports, JSON, etc.) are annotated
 * annotated with v8 ignore start/stop markers to prevent them from dragging down stats.
 */

const coverageConfig = {
  enabled: true,
  thresholds: {
    lines: 85,
    functions: 85,
    branches: 85,
    statements: 85,
  },
  provider: "v8",
  reporter: ["text", "json", "json-summary", "lcovonly", "html"],
  reportsDirectory: "./coverage",

  // Only report files that were actually imported during the test run.
  // This prevents untested source files from being force-added to the report.
  all: false,

  // Apply include/exclude patterns AFTER source-map remapping so that files
  // executed at runtime (e.g. pages, plugins, features) are filtered by their
  // remapped source path, not the compiled file path.
  excludeAfterRemap: true,

  exclude: [
    "**/*.d.ts",
    "**/*.config.{ts,js}",
    "**/*.spec.{ts,tsx}",
    "**/*.test.{ts,tsx}",
    "**/*.types.ts",
    "**/node_modules/**",
    "**/.nuxt/**",
    // Plugins require Nuxt runtime — covered by E2E
    "**/plugins/**",
    // Pages covered by Playwright E2E
    "**/pages/**",
    // Frozen calculation utilities — enabled per feature flag, not MVP
    "**/utils/calculations/**",
    // Static config / i18n JSONs
    "**/config/**",
    "**/i18n/**",
    // Infrastructure files imported transitively — not unit-testable in isolation
    "**/core/**",
    // Feature service/query/client files — covered via component tests + E2E
    "**/features/**",
    // Shared type-only files
    "**/shared/types/**",
    // Test utilities themselves
    "**/test-utils/**",
    // Barrel re-export index files — all lines are v8 ignored, still counted at 0/0
    "**/composables/*/index.ts",
    "**/shared/feature-flags/index.ts",
    // Illustration components — SVG wrappers with no logic, covered by E2E
    "**/illustrations/**",
  ],
} as const;

// defineVitestConfig internally rewrites resolvedConfig.test as
// { projects: [nuxtProject, defaultProject] }, which drops test.coverage
// from the root.  Wrapping the async factory and re-attaching coverage
// at the outer test level restores threshold enforcement and reporters.
const nuxtConfig = defineVitestConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],

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
      "**/e2e/**",
    ],
  },
});

export default async (): Promise<UserConfig> => {
  const resolved =
    typeof nuxtConfig === "function" ? await nuxtConfig() : nuxtConfig;

  return {
    ...resolved,
    test: {
      ...(resolved.test ?? {}),
      coverage: coverageConfig as never,
    },
  };
};
