// vue-i18n runtime options.
// Messages are loaded lazily by @nuxtjs/i18n via the `langDir` + `file`
// configuration in nuxt.config.ts. Do NOT import or bundle messages here —
// the module ignores the `messages` key from vueI18n config and manages its
// own locale registration. Bundling them here would produce a duplicate
// registration that is silently ignored, leaving the runtime messages empty
// (keys rendered as raw strings).
//
// NOTE: defineI18nConfig is NOT auto-imported outside app/ — exporting the
// raw options object directly avoids the wrapper call failing at runtime.
export default {
  legacy: false,
  locale: "pt",
  fallbackLocale: "pt",
};
