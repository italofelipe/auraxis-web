/**
 * Minimal Vitest setup for Stryker mutation testing.
 *
 * Only provides the localStorage polyfill — no Vue i18n plugin needed
 * because mutation targets are pure TypeScript (validators, financial models)
 * that do not mount Vue components or call useI18n().
 */

// Only patch if the standard API is missing
if (
  typeof localStorage === "undefined" ||
  typeof localStorage.getItem !== "function"
) {
  const inMemory: Record<string, string> = {};

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: {
      getItem: (key: string): string | null => inMemory[key] ?? null,
      setItem: (key: string, value: string): void => {
        inMemory[key] = String(value);
      },
      removeItem: (key: string): void => {
        Reflect.deleteProperty(inMemory, key);
      },
      clear: (): void => {
        Object.keys(inMemory).forEach((k) =>
          Reflect.deleteProperty(inMemory, k),
        );
      },
      get length(): number {
        return Object.keys(inMemory).length;
      },
      key: (index: number): string | null =>
        Object.keys(inMemory)[index] ?? null,
    },
  });
}
