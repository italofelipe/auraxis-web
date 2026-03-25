/**
 * Global Vitest setup — runs before every test file.
 *
 * Provides a reliable in-memory localStorage implementation for the happy-dom
 * environment. When `--localstorage-file` is provided with an invalid path
 * (which happens in CI and local runs without a temp dir configured), happy-dom
 * may initialize localStorage without the standard `getItem`/`setItem` methods,
 * causing "localStorage.getItem is not a function" errors in composables that
 * guard their reads with `typeof window !== "undefined"`.
 */

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
