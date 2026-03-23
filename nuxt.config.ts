// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },
  ssr: true,

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL ?? "/",
    head: {
      title: "Auraxis",
      titleTemplate: "%s | Auraxis",
      link: [
        { rel: "manifest", href: "/manifest.webmanifest" },
      ],
      meta: [
        { name: "theme-color", content: "#ffbe4d" },
      ],
    },
  },
  css: ["~/assets/css/main.css"],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? "https://app.auraxis.com.br",
  },

  // ── Módulos ──────────────────────────────────────────────────────────
  modules: [
    "@sentry/nuxt/module", // Error tracking e source maps (opt-in via NUXT_PUBLIC_SENTRY_DSN)
    "@nuxt/eslint",       // Lint integrado ao Nuxt (gera eslint.config via `nuxt lint`)
    "@nuxt/image",        // Componente <NuxtImg> com lazy load e otimização
    "@nuxt/content",      // CMS baseado em arquivos Markdown/YAML/JSON
    "@nuxt/scripts",      // Carregamento otimizado de scripts de terceiros
    "@nuxt/a11y",         // Auditor de acessibilidade em dev
    "@nuxt/hints",        // Sugestões de boas práticas em dev
    "@pinia/nuxt",        // State management
    "@nuxtjs/i18n",       // Internacionalização
    "@nuxtjs/seo",        // Meta tags, sitemap, robots automáticos
    "@nuxtjs/device",     // Detecção de device (mobile/desktop/tablet)
    "@nuxtjs/google-fonts",
    "dayjs-nuxt",
    // '@nuxtjs/apollo',  // ⚠️ Incompatível com Nuxt 4 — aguarda versão estável
    //                       Adicionar de volta quando disponível: https://github.com/nuxt-modules/apollo
  ],

  // ── TypeScript ────────────────────────────────────────────────────────
  typescript: {
    strict: true,
    typeCheck: false, // typecheck roda via `pnpm typecheck` — não bloquear dev server
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? "http://localhost:5000",
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN ?? "",
      appEnv: process.env.NUXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? "development",
    },
  },
  googleFonts: {
    families: {
      "Playfair Display": [400, 500, 600, 700],
      Raleway: [400, 500, 600, 700],
    },
    display: "swap",
    preload: true,
    preconnect: true,
    prefetch: true,
  },

  // ── ESLint (via @nuxt/eslint) ─────────────────────────────────────────
  eslint: {
    config: {
      stylistic: false, // Formatação fica com Prettier
    },
  },

  // ── i18n ──────────────────────────────────────────────────────────────
  i18n: {
    locales: ["pt-BR", "en"],
    defaultLocale: "pt-BR",
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL ?? undefined,
    vueI18n: "./i18n.config.ts",
  },
  ogImage: {
    enabled: false,
  },

  // ── Naive UI — SSR transpile + Vite optimisation ─────────────────────
  // Required to avoid "Cannot use import statement in a module" errors in SSR
  // and to pre-bundle Naive UI's heavy dependency tree during dev startup.
  build: {
    transpile:
      process.env.NODE_ENV === "production"
        ? ["naive-ui", "vueuc", "@css-render/vue3-ssr", "csstype"]
        : [],
  },

  vite: {
    optimizeDeps: {
      include: ["naive-ui", "vueuc"],
    },
  },

  // ── Route Rules ───────────────────────────────────────────────────────
  // Classifies routes as public/noindex/private for SEO and prerendering.
  // Auth enforcement for private routes is handled by middleware, not rules.
  routeRules: {
    // Public + indexable
    "/": { prerender: true },
    "/tools": { prerender: false },
    "/terms-of-service": { prerender: true },
    "/privacy-policy": { prerender: true },

    // Public but noindex (no robots)
    // robots is augmented by @nuxtjs/robots via NitroRouteConfig — vue-tsc does
    // not pick up the declaration when type-checking nuxt.config.ts directly.
    // @ts-expect-error — robots key injected by @nuxtjs/robots module augmentation
    "/login": { robots: false },
    // @ts-expect-error — robots key injected by @nuxtjs/robots module augmentation
    "/register": { robots: false },
    // @ts-expect-error — robots key injected by @nuxtjs/robots module augmentation
    "/forgot-password": { robots: false },

    // Private (auth required — enforced by middleware, not route rules)
    "/dashboard": {},
    "/portfolio": {},
    "/profile": {},
  },

  // ── Nitro ─────────────────────────────────────────────────────────────
  // `sharp` is a native module consumed by @nuxt/image at build time.
  // Marking it external prevents Nitro from tracing optional platform
  // binaries (e.g. @img/sharp-wasm32) that are absent on macOS/arm,
  // which caused ENOENT crashes in `pnpm build` (WEB-BUILD-01).
  // The module remains available at runtime from node_modules.
  nitro: {
    externals: {
      external: ["sharp"],
    },
  },
});
