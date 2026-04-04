/**
 * Manual Vitest mock for vue-i18n.
 *
 * When a test calls `vi.mock("vue-i18n")` without a factory, Vitest finds
 * this file and uses it. The `t` function returns the translation key verbatim
 * so that assertions can be written against stable i18n key strings.
 *
 * Usage in spec files:
 *   vi.mock("vue-i18n");   // no factory needed
 */
/* v8 ignore start */
/**
 * Returns a minimal i18n composable stub that echoes the translation key.
 *
 * @returns Object with a `t` function that returns its argument verbatim.
 */
export const useI18n = (): { t: (key: string) => string } => ({
  t: (key: string) => key,
});
/* v8 ignore stop */
