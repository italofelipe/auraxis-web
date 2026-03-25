// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  // ── Rendering ─────────────────────────────────────────────────────────
  // SSR is enabled globally so that `prerender: true` route rules generate
  // real, fully-rendered HTML at build time (true SSG).
  // Private app routes are individually set to `ssr: false` (SPA shell).
  // This keeps the S3 + CloudFront infra intact — no Node.js server needed.
  ssr: true,
  spaLoadingTemplate: false,

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL ?? "/",
    head: {
      title: "Auraxis",
      titleTemplate: "%s | Auraxis",
      link: [
        { rel: "manifest", href: "/manifest.webmanifest" },
      ],
      // ── Security meta tags ─────────────────────────────────────────
      // NOTE: X-Frame-Options and X-Content-Type-Options cannot be set
      // via <meta http-equiv> — browsers only honour them as HTTP response
      // headers. They MUST be configured in the CloudFront Response Headers
      // Policy (already done). Keeping them here would produce console
      // warnings ("X-Frame-Options may only be set via an HTTP header").
      meta: [
        { name: "theme-color", content: "#ffbe4d" },
        // Restricts referrer info to same origin — protects user session URLs
        { name: "referrer", content: "strict-origin-when-cross-origin" },
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
    "@nuxt/content",      // CMS baseado em arquivos Markdown/YAML/JSON
    "@nuxt/scripts",      // Carregamento otimizado de scripts de terceiros
    "@nuxt/a11y",         // Auditor de acessibilidade em dev
    // "@nuxt/hints" removed — its virtual config import returned 400 in the
    // dev server, causing a cascade that broke the dynamic import of entry.js
    // and made the Vue app fail to hydrate on page load.
    "@pinia/nuxt",        // State management
    "@nuxtjs/i18n",       // Internacionalização
    "@nuxtjs/seo",        // Meta tags, sitemap, robots automáticos
    "@nuxtjs/device",     // Detecção de device (mobile/desktop/tablet)
    "@nuxtjs/google-fonts",
    "dayjs-nuxt",
    // '@nuxt/image',      // ⚠️ Removido: Depende de sharp que causa conflitos de build em ARM64
    // '@nuxtjs/apollo',   // ⚠️ Incompatível com Nuxt 4 — aguarda versão estável
    //                       Adicionar de volta quando disponível: https://github.com/nuxt-modules/apollo
  ],

  // ── Components auto-import ───────────────────────────────────────────
  // Nuxt 4 scans app/components/ by default (srcDir = "app/").
  // Also scan app/shared/components/ so that shared UI components
  // (UiAppShell, UiFormField, etc.) are auto-imported without explicit
  // import statements in layouts and pages.
  components: [
    { path: "~/components" },
    { path: "~/shared/components", pathPrefix: false },
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
  // strategy: "prefix_except_default" → Portuguese (default) uses clean
  // paths (/login, /plans). English uses /en/login, /en/plans, etc.
  //
  // This app is deployed as static files to S3 + CloudFront — there is no
  // Nitro server. @nuxtjs/i18n v10 normally loads locale messages via a
  // /_i18n server endpoint, which would silently fail on a static host and
  // leave the vue-i18n Composer without messages (_s undefined → 500).
  //
  // Messages are instead imported directly in i18n/i18n.config.ts and
  // provided synchronously via the `messages` option. This bundles them
  // into the vueI18n JS chunk so the Composer is always initialised before
  // any component setup runs — no async fetch required.
  i18n: {
    // NOTE: code MUST equal language so that the runtime locale code (which
    // @nuxtjs/i18n v10 derives from the `language` field) matches the `code`
    // used by the URL routing strategy and the vue-i18n messages object.
    // Using different values (e.g. code:"pt" + language:"pt-BR") causes the
    // module to register the locale internally as "pt-BR" while the messages
    // are stored under "pt" → Composer finds no messages → raw keys / _s crash.
    locales: [
      { code: "pt-BR", language: "pt-BR", name: "Português (Brasil)" },
      { code: "en", language: "en", name: "English" },
    ],
    defaultLocale: "pt-BR",
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL ?? undefined,
    strategy: "prefix_except_default",
    skipSettingLocaleOnNavigate: false,
    // vueI18n is resolved relative to <rootDir>/i18n/ (the module's restructureDir).
    // File lives at i18n/i18n.config.ts — imports locale JSON and sets messages.
    vueI18n: "i18n.config.ts",
  },

  ogImage: {
    enabled: false,
  },

  // ── Naive UI — SSR transpile + Vite optimisation ─────────────────────
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
  //
  // Rendering strategy per route:
  //
  //  prerender: true  → HTML generated at build time (SSG). Served as
  //                     a static file from S3. Good for SEO + performance.
  //
  //  ssr: false       → SPA shell only. No server HTML. The client-side
  //                     router + auth middleware handle access control.
  //                     Financial data is NEVER embedded in the static HTML.
  //
  // Security note: private routes use `ssr: false` intentionally — this
  // ensures zero user/financial data is ever pre-rendered into static files
  // that could be cached or indexed by crawlers.
  //
  routeRules: {
    // ── Public — SSG (indexed, shareable) ─────────────────────────────
    "/":                          { prerender: true },
    "/plans":                     { prerender: true },
    "/tools":                     { prerender: true },
    "/tools/installment-vs-cash": { prerender: true },
    "/privacy-policy":            { prerender: true },
    "/terms-of-service":          { prerender: true },

    // ── Auth — SSG (noindex enforced via noindex middleware) ───────────
    "/login":           { prerender: true },
    "/register":        { prerender: true },
    "/forgot-password": { prerender: true },

    // ── EN locale variants — SSG ───────────────────────────────────────
    "/en":                          { prerender: true },
    "/en/plans":                     { prerender: true },
    "/en/tools":                     { prerender: true },
    "/en/tools/installment-vs-cash": { prerender: true },
    "/en/privacy-policy":            { prerender: true },
    "/en/terms-of-service":          { prerender: true },
    "/en/login":                     { prerender: true },
    "/en/register":                  { prerender: true },
    "/en/forgot-password":           { prerender: true },

    // ── Private app — SPA (no prerender, no server HTML) ──────────────
    // Auth middleware enforces access. No financial data in static HTML.
    "/dashboard":     { ssr: false },
    "/portfolio":     { ssr: false },
    "/goals":         { ssr: false },
    "/alerts":        { ssr: false },
    "/simulations":   { ssr: false },
    "/shared-entries":{ ssr: false },
    "/income":        { ssr: false },
    "/subscription":  { ssr: false },
    "/en/dashboard":     { ssr: false },
    "/en/portfolio":     { ssr: false },
    "/en/goals":         { ssr: false },
    "/en/alerts":        { ssr: false },
    "/en/simulations":   { ssr: false },
    "/en/shared-entries":{ ssr: false },
    "/en/income":        { ssr: false },
    "/en/subscription":  { ssr: false },
  },

  // ── Nitro ─────────────────────────────────────────────────────────────
  nitro: {
    prerender: {
      // Seed routes for the crawler. Public pages + auth pages.
      // The crawler will follow internal links and generate locale variants.
      crawlLinks: true,
      routes: [
        "/",
        "/plans",
        "/tools",
        "/tools/installment-vs-cash",
        "/privacy-policy",
        "/terms-of-service",
        "/login",
        "/register",
        "/forgot-password",
        "/en",
        "/en/plans",
        "/en/tools",
        "/en/tools/installment-vs-cash",
        "/en/privacy-policy",
        "/en/terms-of-service",
        "/en/login",
        "/en/register",
        "/en/forgot-password",
      ],
      ignore: ["/sitemap.xml", "/__nuxt_content"],
    },
  },
});
