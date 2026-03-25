// vue-i18n runtime options.
// Messages are loaded lazily by @nuxtjs/i18n via the `langDir` + `file`
// configuration in nuxt.config.ts (lazy: true). Do NOT import or bundle
// messages here — the module manages locale registration via lazy imports.
//
// defineI18nConfig is a global auto-import provided by @nuxtjs/i18n and is
// available in this file even though it lives outside app/.
export default defineI18nConfig(() => ({
  legacy: false,
  locale: "pt",
  fallbackLocale: "pt",
}));
