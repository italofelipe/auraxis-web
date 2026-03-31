// vue-i18n initialization options.
// Messages are NOT imported here — they are loaded via locales[].file in
// nuxt.config.ts, which populates localeLoaders and enables experimental.preload
// to embed messages in the SSG HTML payload (<script data-nuxt-i18n>).
//
// This is required because the app is deployed as static files to S3 +
// CloudFront: there is no Nitro server at runtime, so /_i18n endpoint calls
// would silently fail and leave the vue-i18n Composer without messages.
import type { I18nOptions } from "vue-i18n";

export default (): I18nOptions => ({
  legacy: false,
  locale: "pt-BR",
  fallbackLocale: "pt-BR",
});
