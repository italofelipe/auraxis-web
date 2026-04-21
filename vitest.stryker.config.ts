/**
 * Vitest configuration dedicated to Stryker mutation testing.
 *
 * Uses plain `defineConfig` (not `defineVitestConfig` from @nuxt/test-utils)
 * to avoid the Nuxt runtime requirement.
 *
 * Used with `inPlace: true` in stryker.config.mjs — Stryker mutates source files
 * directly without creating a sandbox, so .nuxt/ tsconfig files are always present.
 *
 * Only pure TypeScript model and schema tests are included — no .vue imports,
 * no Nuxt auto-imports required.
 *
 * Path aliases:
 *   ~ → ./app  (primary source alias)
 *   @ → .      (repo root)
 */

import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  esbuild: {
    // Inline compiler options prevent esbuild from reading tsconfig files independently.
    tsconfigRaw: {
      compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowImportingTsExtensions: true,
      },
    },
  },

  resolve: {
    alias: {
      "~": resolve(__dirname, "app"),
      "@": resolve(__dirname, "."),
    },
  },

  test: {
    environment: "happy-dom",
    globals: true,
    // Use minimal setup (no vue-i18n) — mutation targets are pure TS, no Vue components
    setupFiles: ["./vitest.stryker.setup.ts"],

    include: [
      // Schema validators (CPF/CNPJ/phone)
      "app/schemas/**/*.{spec,test}.{ts,tsx}",
      // Pure financial model logic — no .vue imports, no Nuxt plugins
      "app/features/tools/model/**/*.{spec,test}.{ts,tsx}",
      "app/features/tools/hora-extra/**/*.{spec,test}.{ts,tsx}",
      "app/features/tools/thirteenth-salary/**/*.{spec,test}.{ts,tsx}",
      "app/features/tools/installment-vs-cash/**/*.{spec,test}.{ts,tsx}",
    ],

    exclude: [
      "**/node_modules/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/e2e/**",
    ],
  },
});
