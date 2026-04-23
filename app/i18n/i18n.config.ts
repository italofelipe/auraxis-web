// vue-i18n initialization options.
// Messages are NOT imported here — they are loaded via locales[].file in
// nuxt.config.ts, which populates localeLoaders and enables experimental.preload
// to embed messages in the SSG HTML payload (<script data-nuxt-i18n>).
//
// This is required because the app is deployed as static files to S3 +
// CloudFront: there is no Nitro server at runtime, so /_i18n endpoint calls
// would silently fail and leave the vue-i18n Composer without messages.
import type { I18nOptions } from "vue-i18n";

// numberFormats is mandatory when callers use named formats — `n(value, "currency")`.
// Without a registered named format, vue-i18n v9+ returns an empty string silently,
// which surfaced as blank result boxes in every calculator tool (13º salário, férias,
// rescisão, etc.). Amounts across the app are always in BRL (Brazilian financial app),
// so both locales share the same currency configuration.
const currencyFormats: I18nOptions["numberFormats"] = {
  "pt-BR": {
    currency: { style: "currency", currency: "BRL" },
    percent: { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
  "en": {
    currency: { style: "currency", currency: "BRL" },
    percent: { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
};

export default (): I18nOptions => ({
  legacy: false,
  locale: "pt-BR",
  fallbackLocale: "pt-BR",
  numberFormats: currencyFormats,
});
