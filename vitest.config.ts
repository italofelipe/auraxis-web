import { defineVitestConfig } from '@nuxt/test-utils/config'

/**
 * Vitest configuration — auraxis-web
 * Usa defineVitestConfig do @nuxt/test-utils para integração nativa com Nuxt.
 * Docs: https://nuxt.com/docs/getting-started/testing
 */
export default defineVitestConfig({
  test: {
    // Ambiente de teste com suporte a componentes Nuxt
    environment: 'nuxt',

    // Inclui os helpers do @nuxt/test-utils automaticamente
    globals: true,

    // Padrões de arquivos de teste
    include: [
      'app/**/*.{spec,test}.{ts,tsx}',
      'components/**/*.{spec,test}.{ts,tsx}',
      'composables/**/*.{spec,test}.{ts,tsx}',
      'stores/**/*.{spec,test}.{ts,tsx}',
      'utils/**/*.{spec,test}.{ts,tsx}',
      'server/**/*.{spec,test}.{ts,tsx}',
      '__tests__/**/*.{spec,test}.{ts,tsx}',
    ],

    exclude: [
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/e2e/**',  // E2E é responsabilidade do Playwright
    ],

    // Não falha se não encontrar arquivos de teste
    passWithNoTests: true,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      reportsDirectory: './coverage',

      // Thresholds mínimos de cobertura — falha o CI se não atingir
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },

      include: [
        'app/**/*.{ts,vue}',
        'composables/**/*.ts',
        'stores/**/*.ts',
        'utils/**/*.ts',
        'server/**/*.ts',
      ],

      exclude: [
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/node_modules/**',
        '**/.nuxt/**',
        'app/app.vue',  // Entry point — não testável unitariamente
      ],
    },
  },
})
