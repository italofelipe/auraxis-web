import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchUnleashSnapshot,
  getLocalFlag,
  getProviderMode,
  getRuntimeEnv,
  isFeatureEnabled,
  isStatusEnabledForEnv,
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

  it("retorna override de ambiente quando presente (true)", () => {
    vi.stubEnv("NUXT_PUBLIC_FLAG_WEB_TOOLS_SALARY_RAISE_CALCULATOR", "true");

    const overrideValue = resolveEnvOverride("web.tools.salary-raise-calculator");
    expect(overrideValue).toBe(true);

    vi.unstubAllEnvs();
  });

  it("retorna false quando override de ambiente é 'false'", () => {
    vi.stubEnv("NUXT_PUBLIC_FLAG_WEB_TOOLS_SALARY_RAISE_CALCULATOR", "false");
    expect(resolveEnvOverride("web.tools.salary-raise-calculator")).toBe(false);
  });

  it("retorna false quando override de ambiente é '0'", () => {
    vi.stubEnv("NUXT_PUBLIC_FLAG_WEB_TOOLS_SALARY_RAISE_CALCULATOR", "0");
    expect(resolveEnvOverride("web.tools.salary-raise-calculator")).toBe(false);
  });

  it("retorna undefined quando override tem valor inválido", () => {
    vi.stubEnv("NUXT_PUBLIC_FLAG_WEB_TOOLS_SALARY_RAISE_CALCULATOR", "maybe");
    expect(resolveEnvOverride("web.tools.salary-raise-calculator")).toBeUndefined();
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

  it("retorna undefined quando flag não existe no snapshot remoto", async () => {
    vi.stubEnv("NUXT_PUBLIC_FLAG_PROVIDER", "unleash");
    vi.stubEnv("NUXT_PUBLIC_UNLEASH_PROXY_URL", "https://flags.local");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async (): Promise<{ features: never[] }> => ({ features: [] }),
      }),
    );

    const providerDecision = await resolveProviderDecision("flag.nao.existe");
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

describe("getRuntimeEnv", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to development when no env var is set", () => {
    expect(getRuntimeEnv()).toBe("development");
  });

  it("returns production for NUXT_PUBLIC_APP_ENV=production", () => {
    vi.stubEnv("NUXT_PUBLIC_APP_ENV", "production");
    expect(getRuntimeEnv()).toBe("production");
  });

  it("returns production for NUXT_PUBLIC_APP_ENV=prod (alias)", () => {
    vi.stubEnv("NUXT_PUBLIC_APP_ENV", "prod");
    expect(getRuntimeEnv()).toBe("production");
  });

  it("returns staging for NUXT_PUBLIC_APP_ENV=staging", () => {
    vi.stubEnv("NUXT_PUBLIC_APP_ENV", "staging");
    expect(getRuntimeEnv()).toBe("staging");
  });

  it("falls back to AURAXIS_RUNTIME_ENV when NUXT_PUBLIC_APP_ENV is absent", () => {
    vi.stubEnv("AURAXIS_RUNTIME_ENV", "staging");
    expect(getRuntimeEnv()).toBe("staging");
  });
});

describe("isStatusEnabledForEnv", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("enabled-prod is active in production", () => {
    vi.stubEnv("NUXT_PUBLIC_APP_ENV", "production");
    expect(isStatusEnabledForEnv("enabled-prod")).toBe(true);
  });

  it("enabled-prod is active in staging", () => {
    vi.stubEnv("NUXT_PUBLIC_APP_ENV", "staging");
    expect(isStatusEnabledForEnv("enabled-prod")).toBe(true);
  });

  it("enabled-prod is active in development", () => {
    expect(isStatusEnabledForEnv("enabled-prod")).toBe(true);
  });

  it("enabled-staging is active in development", () => {
    expect(isStatusEnabledForEnv("enabled-staging")).toBe(true);
  });

  it("enabled-staging is active in staging", () => {
    vi.stubEnv("NUXT_PUBLIC_APP_ENV", "staging");
    expect(isStatusEnabledForEnv("enabled-staging")).toBe(true);
  });

  it("enabled-staging is NOT active in production", () => {
    vi.stubEnv("NUXT_PUBLIC_APP_ENV", "production");
    expect(isStatusEnabledForEnv("enabled-staging")).toBe(false);
  });

  it("enabled-dev is active in development", () => {
    expect(isStatusEnabledForEnv("enabled-dev")).toBe(true);
  });

  it("enabled-dev is NOT active in staging", () => {
    vi.stubEnv("NUXT_PUBLIC_APP_ENV", "staging");
    expect(isStatusEnabledForEnv("enabled-dev")).toBe(false);
  });

  it("enabled-dev is NOT active in production", () => {
    vi.stubEnv("NUXT_PUBLIC_APP_ENV", "production");
    expect(isStatusEnabledForEnv("enabled-dev")).toBe(false);
  });

  it("draft is never active", () => {
    expect(isStatusEnabledForEnv("draft")).toBe(false);
  });

  it("removed is never active", () => {
    expect(isStatusEnabledForEnv("removed")).toBe(false);
  });

  it("legacy 'active' status is still recognized", () => {
    expect(isStatusEnabledForEnv("active")).toBe(true);
  });
});
