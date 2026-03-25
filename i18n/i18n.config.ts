// vue-i18n runtime options.
// Messages are imported directly here so they are bundled synchronously
// into the JS chunk — no async /_i18n server call needed. This is required
// because the app is deployed as static files to S3 + CloudFront: there is
// no Nitro server, so any dynamic message-loading strategy would fail at
// runtime and leave the Composer without messages (_s undefined).
//
// NOTE: defineI18nConfig is NOT used here intentionally. It is a Nuxt
// auto-import that the Vite dev transform injects in dev mode but is NOT
// reliably available inside the i18n/ directory chunk in the production
// bundle. Using a plain arrow function guarantees the export is always a
// callable function regardless of the build context.
import type { I18nOptions } from "vue-i18n";
import pt from "./locales/pt.json";
import en from "./locales/en.json";

// NOTE: message keys MUST match the runtime locale code used by @nuxtjs/i18n v10.
// The module promotes the `language` field value (e.g. "pt-BR") as the effective
// locale code at runtime — NOT the `code` field. Keys must align with that value,
// otherwise the vue-i18n Composer cannot find the messages and either renders raw
// translation keys or crashes with "_s undefined".
export default (): I18nOptions => ({
  legacy: false,
  locale: "pt-BR",
  fallbackLocale: "pt-BR",
  messages: {
    "pt-BR": pt,
    en,
  },
});
