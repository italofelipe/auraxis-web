import ptBR from "./app/i18n/locales/pt-BR.json";
import en from "./app/i18n/locales/en.json";

export default defineI18nConfig(() => ({
  legacy: false,
  locale: "pt-BR",
  fallbackLocale: "pt-BR",
  messages: {
    "pt-BR": ptBR,
    en,
  },
}));
