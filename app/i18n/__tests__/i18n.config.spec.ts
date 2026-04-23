import { createI18n, type Composer } from "vue-i18n";
import { describe, expect, it } from "vitest";

import createI18nOptions from "../i18n.config";

/**
 * Returns the composition-API composer exposed by an i18n instance created
 * with `legacy: false`. vue-i18n's default types assume Legacy mode, so we
 * narrow here once instead of casting at every call site.
 *
 * @param i18n vue-i18n instance produced by `createI18n`.
 * @returns The Composer backing the `global` property of the instance.
 */
function composerOf(i18n: ReturnType<typeof createI18n>): Composer {
  return i18n.global as unknown as Composer;
}

describe("i18n.config numberFormats", () => {
  const global = composerOf(createI18n({ ...createI18nOptions(), legacy: false }));

  it("formata currency em pt-BR como BRL (R$)", () => {
    global.locale.value = "pt-BR";
    expect(global.n(1234.56, "currency")).toMatch(/^R\$\s?1\.234,56$/);
  });

  it("formata currency em en como BRL (app é BR-only)", () => {
    global.locale.value = "en";
    expect(global.n(1234.56, "currency")).toMatch(/1,234\.56/);
  });

  it("nunca retorna string vazia para named format 'currency'", () => {
    global.locale.value = "pt-BR";
    expect(global.n(0, "currency")).not.toBe("");
    global.locale.value = "en";
    expect(global.n(0, "currency")).not.toBe("");
  });
});
