/**
 * lint-staged — auraxis-web
 *
 * Biome faz lint + format em um único passo (substitui ESLint + Prettier).
 * TypeScript check e testes rodam no pre-push (precisam do contexto global).
 */
module.exports = {
  // Vue, TypeScript, TSX — Biome lint + format
  '**/*.{ts,tsx,vue}': [
    'npx biome check --write --no-errors-on-unmatched',
  ],

  // JSON, JSONC — Biome format
  '**/*.{json,jsonc}': [
    'npx biome format --write',
  ],
}
