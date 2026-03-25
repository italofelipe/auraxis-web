// vue-i18n runtime options.
// Messages are imported directly here so they are bundled synchronously
// into the JS chunk — no async /_i18n server call needed. This is required
// because the app is deployed as static files to S3 + CloudFront: there is
// no Nitro server, so any dynamic message-loading strategy would fail at
// runtime and leave the Composer without messages (_s undefined).
import pt from "./locales/pt.json";
import en from "./locales/en.json";

export default defineI18nConfig(() => ({
  legacy: false,
  locale: "pt",
  fallbackLocale: "pt",
  messages: {
    pt,
    en,
  },
}));
