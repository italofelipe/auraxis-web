import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration — auraxis-web
 * Docs: https://playwright.dev/docs/test-configuration
 *
 * Rodar localmente:
 *   pnpm test:e2e          — headless (todos os browsers)
 *   pnpm test:e2e:ui       — modo interativo com UI
 *   pnpm test:e2e:debug    — debug step-by-step
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",

  // MSW Node interceptor — starts before browsers, shuts down after all tests
  globalSetup: "./e2e/setup/global-setup.ts",

  // Timeout por teste (30s) e por assertion (5s)
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Re-executa testes que falharam (flakiness mitigation)
  retries: process.env.CI ? 2 : 0,

  // Workers: paralelo no CI, sequencial localmente por padrão
  workers: process.env.CI ? "50%" : undefined,

  // Reporter: HTML para leitura local + GitHub Actions no CI
  reporter: process.env.CI
    ? [["github"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : [["html", { open: "on-failure" }]],

  // Configurações globais para todos os testes
  use: {
    baseURL: BASE_URL,
    // Grava trace em falhas (útil para debugging no CI)
    trace: "on-first-retry",
    // Screenshot automático em falhas
    screenshot: "only-on-failure",
    // Video apenas em CI para não consumir espaço localmente
    video: process.env.CI ? "on-first-retry" : "off",
  },

  // Inicia o servidor Nuxt antes dos testes (apenas se não estiver rodando)
  webServer: {
    command: "NITRO_HOST=0.0.0.0 NITRO_PORT=3000 pnpm preview",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },

  projects: [
    // Desktop browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    // Mobile viewport (SSR responsivo)
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
    },
    // No CI, rodar apenas Chromium para economizar tempo
    // Descomentar outros browsers quando a suíte E2E estiver madura
  ].filter(
    (p) =>
      !process.env.CI ||
      p.name === "chromium" ||
      p.name === "mobile-chrome",
  ),
});
