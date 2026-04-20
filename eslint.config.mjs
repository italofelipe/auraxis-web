// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import jsdoc from "eslint-plugin-jsdoc";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";

export default withNuxt(
  {
    ignores: [
      ".nuxt/**",
      ".output/**",
      ".claude/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      // Duplicate artefact files with spaces in their names left by automated
      // tooling. They are not tracked by git and should not be linted.
      "**/* 2.*",
      // Auto-generated OpenAPI types — name conventions enforced by the generator.
      "app/shared/types/generated/**",
      // Platform tooling scripts — not product code, follow their own conventions.
      "scripts/**",
      // Stryker mutation testing sandbox — generated, not product code.
      ".stryker-tmp/**",
      "mutation-report/**",
    ],
  },
  // ── SonarJS: code-smell and reliability rules ────────────────────────────
  sonarjs.configs.recommended,
  {
    rules: {
      // Nested functions are idiomatic in Vue composables — disable globally.
      "sonarjs/no-nested-functions": "off",
      // Raise threshold: Vue components tend to have higher cognitive complexity.
      "sonarjs/cognitive-complexity": ["error", 20],
      // TODO/FIXME comments are used intentionally during development.
      "sonarjs/todo-tag": "off",
      "sonarjs/fixme-tag": "off",
      // Commented-out code occurs during refactoring; kept off to reduce noise.
      "sonarjs/no-commented-code": "off",
      // `void expr` is idiomatic in Vue event handlers to discard Promises
      // without await while keeping explicit return types.
      "sonarjs/void-use": "off",
      // sonarjs has its own unused-vars rule; defer to @typescript-eslint which
      // is type-aware and respects the _prefix ignore pattern already configured.
      "sonarjs/no-unused-vars": "off",
    },
  },
  // ── Security: frontend-relevant vulnerability checks ─────────────────────
  {
    plugins: { security },
    rules: {
      // ReDoS — unsafe regular expressions that can stall the engine.
      "security/detect-unsafe-regex": "error",
      // eval() with a non-literal expression is always a security risk.
      "security/detect-eval-with-expression": "error",
      // Bidirectional Unicode characters (Trojan Source attack vector).
      "security/detect-bidi-characters": "error",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,vue}"],
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double", { avoidEscape: false }],
      complexity: ["error", 12],
      "max-params": ["error", 3],
      "max-lines-per-function": [
        "error",
        {
          max: 80,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      "max-depth": ["error", 3],
      "max-statements": ["error", 18],
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "object-shorthand": ["error", "always"],
      "no-duplicate-imports": "error",
      "consistent-return": "error",
      "max-classes-per-file": ["error", 1],
      "class-methods-use-this": "warn",
      "accessor-pairs": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx,vue}"],
    plugins: {
      jsdoc,
    },
    settings: {
      jsdoc: {
        mode: "typescript",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: false,
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "jsdoc/require-jsdoc": [
        "error",
        {
          contexts: [
            "FunctionDeclaration",
            "VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
            "VariableDeclaration > VariableDeclarator > FunctionExpression",
            "MethodDefinition",
          ],
        },
      ],
      "jsdoc/require-param": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/check-tag-names": "error",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/no-undefined-types": "off",
      // PERF-7: every Vue Query call must set `staleTime` explicitly, so
      // cache-freshness contract is visible at the call site. Use the
      // `STALE_TIME` presets from `~/core/query` when in doubt.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name=/^(useQuery|useInfiniteQuery|createApiQuery)$/] > ObjectExpression:first-child:not(:has(Property[key.name='staleTime']))",
          message:
            "Vue Query calls must set an explicit `staleTime` — import `STALE_TIME` from `~/core/query` (PERF-7).",
        },
        {
          selector:
            "CallExpression[callee.name=/^(useQuery|useInfiniteQuery|createApiQuery)$/]:not(:has(ObjectExpression Property[key.name='staleTime']))",
          message:
            "Vue Query calls must set an explicit `staleTime` — import `STALE_TIME` from `~/core/query` (PERF-7).",
        },
      ],
    },
  },
  // The Vue Query wrapper factory itself forwards `staleTime` through its
  // options bag and does not set a default — enforcing the rule inside
  // `app/core/query/` would be a false positive.
  {
    files: ["app/core/query/**"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["**/*.{test,spec,e2e}.{js,ts,tsx}", "**/__tests__/**/*.{js,ts,tsx}"],
    rules: {
      complexity: ["error", 20],
      "max-lines-per-function": [
        "error",
        {
          max: 250,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      "max-statements": ["error", 30],
      "max-params": ["error", 5],
      "no-console": "off",
      // http://localhost URLs are expected in test fixtures.
      "sonarjs/no-clear-text-protocols": "off",
    },
  },
);
