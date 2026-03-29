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
      // Default title rendered when no page overrides it via useSeoMeta/useHead.
      // titleTemplate wraps every page title: "Planos e Preços | Auraxis", etc.
      // Avoids the previous "Auraxis | Auraxis" duplication.
      title: "Planner Financeiro Inteligente",
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
        // ── SEO ───────────────────────────────────────────────────────
        {
          name: "description",
          content:
            "Gerencie carteira, metas e finanças pessoais em um só lugar. "
            + "Acompanhe investimentos, simule cenários e tome decisões financeiras com inteligência.",
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Auraxis" },
        {
          property: "og:title",
          content: "Auraxis – Planner Financeiro Inteligente",
        },
        {
          property: "og:description",
          content:
            "Gerencie carteira, metas e finanças pessoais em um só lugar. "
            + "Acompanhe investimentos, simule cenários e tome decisões financeiras com inteligência.",
        },
        { property: "og:locale", content: "pt_BR" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Auraxis – Planner Financeiro Inteligente",
        },
        {
          name: "twitter:description",
          content:
            "Gerencie carteira, metas e finanças pessoais em um só lugar. "
            + "Acompanhe investimentos, simule cenários e tome decisões financeiras com inteligência.",
        },
        // ── Security ──────────────────────────────────────────────────
        { name: "theme-color", content: "#ffbe4d" },
        // Restricts referrer info to same origin — protects user session URLs
        { name: "referrer", content: "strict-origin-when-cross-origin" },
        // Baked in by CI via NUXT_PUBLIC_BUILD_ID="<run_id>-<sha>".
        // The post-deploy smoke test reads this tag to verify CloudFront is
        // serving the current build and not a cached stale snapshot.
        // Empty string in local dev — harmless.
        { name: "x-build-id", content: process.env.NUXT_PUBLIC_BUILD_ID ?? "" },
      ],
    },
  },
  css: ["~/assets/css/main.css"],

  // ── @nuxtjs/seo — site-wide defaults ─────────────────────────────────────
  // Used by nuxt-site-config (bundled in @nuxtjs/seo) to auto-generate
  // canonical URLs, og:url, sitemap entries and locale alternate links.
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? "https://app.auraxis.com.br",
    name: "Auraxis",
    description:
      "Planner financeiro inteligente para gerenciar carteira de investimentos, "
      + "metas financeiras e finanças pessoais.",
    defaultLocale: "pt-BR",
    indexable: true,
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
  // All components live in app/components/, organized into domain
  // subdirectories (alert/, auth/, dashboard/, ui/, etc.).
  // pathPrefix: false → Nuxt uses the filename as the component name,
  // not the directory path. So components/alert/AlertItem.vue → <AlertItem>
  // and components/ui/UiAppShell/UiAppShell.vue → <UiAppShell>.
  components: [
    { path: "~/components", pathPrefix: false },
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
      // Injected by CI as "<run_id>-<sha>". Baked into the HTML meta tag
      // `x-build-id` during SSG so the smoke test can verify that CloudFront
      // is serving the freshly-deployed build rather than a stale snapshot.
      buildId: process.env.NUXT_PUBLIC_BUILD_ID ?? "",
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
  // FIX: experimental.preload embeds ALL locale messages directly into the
  // SSR/SSG payload ($si18n:cached-locale-configs). This guarantees messages
  // are available to the vue-i18n Composer during client hydration without
  // any /_i18n server call — required for static S3 deployments.
  i18n: {
    // NOTE: code MUST equal language so that the runtime locale code (which
    // @nuxtjs/i18n v10 derives from the `language` field) matches the `code`
    // used by the URL routing strategy and the vue-i18n messages object.
    // Using different values (e.g. code:"pt" + language:"pt-BR") causes the
    // module to register the locale internally as "pt-BR" while the messages
    // are stored under "pt" → Composer finds no messages → raw keys / _s crash.
    //
    // `file` is required so that @nuxtjs/i18n populates `localeLoaders` for each
    // locale. Without `file`, localeLoaders is empty → the internal messages.json
    // server route (used by experimental.preload during SSG) returns {} → no
    // <script data-nuxt-i18n> is injected in the HTML → client falls back to the
    // /_i18n runtime endpoint which does not exist on static S3 → _s undefined.
    langDir: "locales",
    locales: [
      {
        code: "pt-BR",
        language: "pt-BR",
        name: "Português (Brasil)",
        file: "pt.json",
      },
      {
        code: "en",
        language: "en",
        name: "English",
        file: "en.json",
      },
    ],
    defaultLocale: "pt-BR",
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL ?? undefined,
    strategy: "prefix_except_default",
    skipSettingLocaleOnNavigate: false,
    // vueI18n is resolved relative to <rootDir>/i18n/ (the module's restructureDir).
    // File lives at i18n/i18n.config.ts — sets initialization options only (legacy,
    // fallbackLocale, etc.). Messages are loaded via locales[].file above.
    vueI18n: "i18n.config.ts",
    // experimental.preload: during SSG, fetches messages from the internal
    // messages.json Nitro route (populated via localeLoaders from locales[].file)
    // and injects a <script data-nuxt-i18n> tag into every prerendered HTML page.
    // The client plugin reads from this tag instead of fetching /_i18n — required
    // for static S3 deployments where there is no Nitro server at runtime.
    experimental: {
      preload: true,
    },
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
