/**
 * lint-staged — auraxis-web
 *
 * ESLint via @nuxt/eslint cuida de lint + regras Vue/TypeScript.
 * Prettier cuida de formatação (JSON, Markdown).
 * TypeScript check e testes rodam no pre-push (precisam do contexto global).
 */
module.exports = {
  // Vue, TypeScript — ESLint fix automático nos staged files
  '**/*.{ts,tsx,vue}': [
    'eslint --fix',
  ],

  // JSON, Markdown — Prettier
  '**/*.{json,jsonc,md}': [
    'prettier --write',
  ],
}
