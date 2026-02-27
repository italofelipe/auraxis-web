// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import jsdoc from "eslint-plugin-jsdoc";

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
