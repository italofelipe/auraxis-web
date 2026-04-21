/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: "vitest",
  // pnpm virtual store requires explicit plugin registration
  plugins: ["@stryker-mutator/vitest-runner"],
  coverageAnalysis: "perTest",

  vitest: {
    configFile: "vitest.stryker.config.ts",
  },

  /**
   * Mutation scope: pure financial calculation logic only.
   *
   * Validators (CPF/CNPJ/phone) and model-layer calculators are the highest-value
   * targets because they contain boundary conditions and arithmetic that coverage
   * alone cannot verify.
   */
  mutate: [
    // Validators: CPF, CNPJ, phone
    "app/schemas/validators.ts",

    // Core financial model — pure functions, no Vue deps
    "app/features/tools/model/hora-extra.ts",
    "app/features/tools/model/thirteenth-salary.ts",
    "app/features/tools/model/installment-vs-cash.ts",
    "app/features/tools/model/inss-ir-folha.ts",
    "app/features/tools/model/juros-compostos.ts",
    "app/features/tools/model/math-utils.ts",
    "app/features/tools/model/cet.ts",
    "app/features/tools/model/salario-liquido.ts",
    "app/features/tools/model/rescisao.ts",
    "app/features/tools/model/ferias.ts",
    "app/features/tools/model/fgts.ts",
    "app/features/tools/model/desconto-markup.ts",
    "app/features/tools/model/reserva-emergencia.ts",
    "app/features/tools/model/orcamento-50-30-20.ts",
    "app/features/tools/model/fire.ts",
    "app/features/tools/model/aposentadoria.ts",
    "app/features/tools/model/cdb-lci-lca.ts",
    "app/features/tools/model/financiamento-imobiliario.ts",
    "app/features/tools/model/tesouro-direto.ts",
    "app/features/tools/model/mei.ts",
    "app/features/tools/model/clt-vs-pj.ts",
    "app/features/tools/model/fii.ts",
    "app/features/tools/model/quitacao-dividas.ts",
    "app/features/tools/model/aluguel-vs-compra.ts",
    "app/features/tools/model/dividir-conta.ts",
    "app/features/tools/model/custo-estilo-vida.ts",
  ],

  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },

  reporters: ["html", "clear-text", "progress"],

  htmlReporter: {
    fileName: "mutation-report/index.html",
  },

  timeoutMS: 60000,
  timeoutFactor: 2,

  incremental: true,
  incrementalFile: ".stryker-tmp/incremental.json",

  /**
   * Exclude directories that Stryker cannot safely copy into its sandbox.
   * - dist: symlink to .output/public — copyfile fails on sockets/symlinks (ENOTSUP)
   * - .nuxt / .output: build artifacts, not needed for unit test sandboxes
   */
  tempDirName: ".stryker-tmp",
  ignorePatterns: [
    // dist is a symlink to .output/public — copyfile fails with ENOTSUP
    "dist",
    ".output",
    ".nitro",
    "coverage",
    "mutation-report",
    "playwright-report",
    "test-results",
    "storybook-static",
    "public",
  ],

};
