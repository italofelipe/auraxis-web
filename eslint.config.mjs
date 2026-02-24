// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  {
    ignores: [
      ".nuxt/**",
      ".output/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
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
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
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
    },
  },
  {
    files: ["**/*.{test,spec}.{js,ts,tsx}", "**/__tests__/**/*.{js,ts,tsx}"],
    rules: {
      complexity: ["error", 20],
      "max-lines-per-function": [
        "error",
        {
          max: 140,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      "max-statements": ["error", 30],
      "no-console": "off",
    },
  },
);
