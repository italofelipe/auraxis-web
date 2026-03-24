// vue-i18n runtime options.
// Messages are NOT defined here — they are lazy-loaded from
// app/i18n/locales/{pt,en}.json by @nuxtjs/i18n.
// The module embeds them into the Nuxt payload at SSR/prerender time
// so the client hydrates without an extra fetch (no flash of raw keys).
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: "pt",
}));
