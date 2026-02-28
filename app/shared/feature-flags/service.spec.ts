import { describe, expect, it, vi } from "vitest";

import { getLocalFlag, isFeatureEnabled, resolveEnvOverride, toEnvSuffix } from "./service";

describe("feature flag service", () => {
  it("normaliza sufixo de env var a partir da chave da flag", () => {
    expect(toEnvSuffix("web.tools.salary-raise-calculator")).toBe("WEB_TOOLS_SALARY_RAISE_CALCULATOR");
  });

  it("retorna undefined quando override de env não existe", () => {
    const overrideValue = resolveEnvOverride("web.tools.salary-raise-calculator");
    expect(overrideValue).toBeUndefined();
  });

  it("retorna override de ambiente quando presente", () => {
    vi.stubEnv("NUXT_PUBLIC_FLAG_WEB_TOOLS_SALARY_RAISE_CALCULATOR", "true");

    const overrideValue = resolveEnvOverride("web.tools.salary-raise-calculator");
    expect(overrideValue).toBe(true);

    vi.unstubAllEnvs();
  });

  it("retorna definição da flag quando ela existe no catálogo", () => {
    const localFlag = getLocalFlag("web.tools.salary-raise-calculator");
    expect(localFlag?.key).toBe("web.tools.salary-raise-calculator");
  });

  it("considera flag desabilitada quando status local é draft", () => {
    expect(isFeatureEnabled("web.tools.salary-raise-calculator")).toBe(false);
  });

  it("respeita decisão explícita do provider externo", () => {
    expect(isFeatureEnabled("web.tools.salary-raise-calculator", true)).toBe(true);
    expect(isFeatureEnabled("web.tools.salary-raise-calculator", false)).toBe(false);
  });
});
