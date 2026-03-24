// vue-i18n runtime options.
// Messages are bundled directly (not lazy-loaded) so they are available
// synchronously during SSG hydration. Lazy loading caused a race condition
// where components called t() before the async locale fetch resolved,
// producing "Cannot read properties of undefined (reading '_s')".
//
// NOTE: defineI18nConfig is NOT auto-imported outside app/ — exporting the
// raw options object directly avoids the wrapper call failing at runtime.
import pt from "./app/locales/pt.json";
import en from "./app/locales/en.json";

export default {
  legacy: false,
  locale: "pt",
  fallbackLocale: "pt",
  messages: { pt, en },
};
