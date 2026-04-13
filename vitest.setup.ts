/**
 * Global Vitest setup — runs before every test file.
 *
 * 1. Provides a reliable in-memory localStorage implementation for the happy-dom
 *    environment. When `--localstorage-file` is provided with an invalid path
 *    (which happens in CI and local runs without a temp dir configured), happy-dom
 *    may initialize localStorage without the standard `getItem`/`setItem` methods,
 *    causing "localStorage.getItem is not a function" errors in composables that
 *    guard their reads with `typeof window !== "undefined"`.
 *
 * 2. Installs a real `vue-i18n` instance (pt-BR locale from app/i18n/locales/pt.json)
 *    as a global Vue Test Utils plugin so that any component that calls `useI18n()`
 *    or uses `$t()` works without needing per-test mocks.
 *
 *    Components that explicitly `vi.mock("vue-i18n")` in their spec files override
 *    this global setup — their per-file mock takes precedence (module-level mock wins
 *    over the plugin-injected composable). Those tests retain their key-based
 *    assertions unchanged.
 */

import { config } from "@vue/test-utils";
import { createI18n } from "vue-i18n";

import ptMessages from "./app/i18n/locales/pt.json";
import enMessages from "./app/i18n/locales/en.json";

// ── 1. localStorage patch ─────────────────────────────────────────────────────

// Only patch if the standard API is missing (don't override a working implementation).
if (typeof localStorage === "undefined" || typeof localStorage.getItem !== "function") {
  const inMemory: Record<string, string> = {};

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: {
      getItem: (key: string): string | null => inMemory[key] ?? null,
      setItem: (key: string, value: string): void => { inMemory[key] = String(value); },
      removeItem: (key: string): void => { Reflect.deleteProperty(inMemory, key); },
      clear: (): void => { Object.keys(inMemory).forEach((k) => Reflect.deleteProperty(inMemory, k)); },
      get length(): number { return Object.keys(inMemory).length; },
      key: (index: number): string | null => Object.keys(inMemory)[index] ?? null,
    },
  });
}

// ── 2. Global i18n plugin ─────────────────────────────────────────────────────

/**
 * Real vue-i18n instance with PT-BR as default locale.
 * Installed globally so every `mount()` / `renderWithProviders()` call has
 * `useI18n()` available without requiring per-file mocks or manual plugin setup.
 *
 * Tests that already mock `vue-i18n` via `vi.mock("vue-i18n")` continue to work:
 * the hoisted module mock overrides the composable at import time, while this
 * plugin handles the inject/provide layer used by `$t()` in templates.
 */
const i18n = createI18n({
  legacy: false,
  locale: "pt-BR",
  fallbackLocale: "en",
  messages: {
    "pt-BR": ptMessages,
    en: enMessages,
  },
});

config.global.plugins = [
  ...(config.global.plugins ?? []),
  i18n,
];

