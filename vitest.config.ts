import { defineVitestConfig } from "@nuxt/test-utils/config";

/**
 * Vitest configuration — auraxis-web
 * Usa defineVitestConfig do @nuxt/test-utils para integração nativa com Nuxt.
 * Docs: https://nuxt.com/docs/getting-started/testing
 */
export default defineVitestConfig({
  test: {
    // Baseline WEB10: evita bootstrap completo do Nuxt em testes unitários iniciais.
    // Para testes com runtime Nuxt, usar `// @vitest-environment nuxt` por arquivo.
    environment: "happy-dom",

    // Inclui os helpers do @nuxt/test-utils automaticamente
    globals: true,

    // Padrões de arquivos de teste
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
      "**/e2e/**",  // E2E é responsabilidade do Playwright
    ],

    coverage: {
      enabled: true,
      // Falha explicitamente quando qualquer threshold não é atingido.
      // Sem este flag o relatório pode ser gerado sem bloquear a execução.
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
      ],
    },
  },
});
