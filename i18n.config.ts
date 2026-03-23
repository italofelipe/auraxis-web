import pt from "~/i18n/locales/pt";
import en from "~/i18n/locales/en";

export default defineI18nConfig(() => ({
  legacy: false,
  locale: "pt",
  fallbackLocale: "pt",
  messages: {
    pt,
    "pt-BR": pt,
    en,
    "en-US": en,
  },
}));
