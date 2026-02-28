import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchUnleashSnapshot,
  getLocalFlag,
  getProviderMode,
  isFeatureEnabled,
  resetProviderCache,
  resolveEnvOverride,
  resolveProviderDecision,
  toEnvSuffix,
} from "./service";

describe("feature flag service", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetProviderCache();
  });

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

  it("retorna modo local quando provider não está configurado", () => {
    expect(getProviderMode()).toBe("local");
  });

  it("resolve decisão remota quando provider unleash está ativo", async () => {
    vi.stubEnv("NUXT_PUBLIC_FLAG_PROVIDER", "unleash");
    vi.stubEnv("NUXT_PUBLIC_UNLEASH_PROXY_URL", "https://flags.local");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          features: [
            {
              name: "web.tools.salary-raise-calculator",
              enabled: true,
            },
          ],
        }),
      }),
    );

    const providerDecision = await resolveProviderDecision(
      "web.tools.salary-raise-calculator",
    );
    expect(providerDecision).toBe(true);
  });

  it("retorna undefined quando provider remoto falha", async () => {
    vi.stubEnv("NUXT_PUBLIC_FLAG_PROVIDER", "unleash");
    vi.stubEnv("NUXT_PUBLIC_UNLEASH_PROXY_URL", "https://flags.local");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const providerDecision = await resolveProviderDecision(
      "web.tools.salary-raise-calculator",
    );
    expect(providerDecision).toBeUndefined();
  });

  it("aceita provider canônico AURAXIS_FLAG_PROVIDER como fallback", () => {
    vi.stubEnv("AURAXIS_FLAG_PROVIDER", "unleash");
    expect(getProviderMode()).toBe("unleash");
  });

  it("aceita URL canônica AURAXIS_UNLEASH_URL para snapshot remoto", async () => {
    vi.stubEnv("AURAXIS_FLAG_PROVIDER", "unleash");
    vi.stubEnv("AURAXIS_UNLEASH_URL", "https://flags.local");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          features: [
            {
              name: "web.tools.salary-raise-calculator",
              enabled: true,
            },
          ],
        }),
      }),
    );

    const snapshot = await fetchUnleashSnapshot();
    expect(snapshot["web.tools.salary-raise-calculator"]).toBe(true);
  });
});
