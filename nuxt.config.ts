// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  // ── Módulos ──────────────────────────────────────────────────────────
  modules: [
    '@nuxt/eslint',       // Lint integrado ao Nuxt (gera eslint.config via `nuxt lint`)
    '@nuxt/image',        // Componente <NuxtImg> com lazy load e otimização
    '@nuxt/content',      // CMS baseado em arquivos Markdown/YAML/JSON
    '@nuxt/scripts',      // Carregamento otimizado de scripts de terceiros
    '@nuxt/a11y',         // Auditor de acessibilidade em dev
    '@nuxt/hints',        // Sugestões de boas práticas em dev
    '@pinia/nuxt',        // State management
    '@pinia/colada-nuxt', // Data fetching layer para Pinia
    '@nuxtjs/i18n',       // Internacionalização
    '@nuxtjs/seo',        // Meta tags, sitemap, robots automáticos
    '@nuxtjs/device',     // Detecção de device (mobile/desktop/tablet)
    '@nuxt/ui',           // Componentes UI (baseado em Tailwind + Reka UI)
    '@nuxtjs/google-fonts',
    'dayjs-nuxt',
    // '@nuxtjs/apollo',  // ⚠️ Incompatível com Nuxt 4 — aguarda versão estável
    //                       Adicionar de volta quando disponível: https://github.com/nuxt-modules/apollo
  ],

  // ── TypeScript ────────────────────────────────────────────────────────
  typescript: {
    strict: true,
    typeCheck: false, // typecheck roda via `pnpm typecheck` — não bloquear dev server
  },

  // ── ESLint (via @nuxt/eslint) ─────────────────────────────────────────
  eslint: {
    config: {
      stylistic: false, // Formatação fica com Prettier
    },
  },

  // ── i18n ──────────────────────────────────────────────────────────────
  i18n: {
    locales: ['pt-BR', 'en'],
    defaultLocale: 'pt-BR',
  },
})
