import featureFlagsCatalogJson from "../../../config/feature-flags.json";

import type {
  FeatureFlagCatalog,
  FeatureFlagDefinition,
} from "./types";

const featureFlagsCatalog: FeatureFlagCatalog =
  featureFlagsCatalogJson as FeatureFlagCatalog;

/**
 * Statuses that are unconditionally enabled regardless of runtime environment.
 * Legacy values (active, released, enabled) are kept for backwards compatibility.
 */
const alwaysEnabledStatuses = new Set<string>([
  "enabled",
  "enabled-prod",
  "active",
  "released",
]);

/**
 * Returns the current runtime environment tier.
 * Checked via NUXT_PUBLIC_APP_ENV or AURAXIS_RUNTIME_ENV.
 * Defaults to "development" when unset (safe fallback for local runs).
 *
 * @returns The resolved environment tier.
 */
export const getRuntimeEnv = (): "development" | "staging" | "production" => {
  const raw = (
    process.env.NUXT_PUBLIC_APP_ENV ??
    process.env.AURAXIS_RUNTIME_ENV ??
    "development"
  )
    .trim()
    .toLowerCase();
  if (raw === "production" || raw === "prod") {return "production";}
  if (raw === "staging") {return "staging";}
  return "development";
};

/**
 * Determines whether a catalog status string maps to "enabled"
 * for the current runtime environment.
 *
 * Promotion ladder (each level includes those below it):
 *   enabled-dev      → development only
 *   enabled-staging  → development + staging
 *   enabled-prod     → all environments (same as enabled)
 *
 * @param status Raw status string from the flag catalog.
 * @returns True when the flag should be considered active.
 */
export const isStatusEnabledForEnv = (status: string): boolean => {
  const s = status.trim().toLowerCase();
  if (alwaysEnabledStatuses.has(s)) {return true;}
  const env = getRuntimeEnv();
  if (s === "enabled-staging") {return env === "development" || env === "staging";}
  if (s === "enabled-dev") {return env === "development";}
  return false;
};

const overridePrefix = "NUXT_PUBLIC_FLAG_";
const defaultUnleashAppName = "auraxis-web";
const defaultUnleashEnvironment = "development";
const defaultUnleashInstanceId = "auraxis-web";
const defaultUnleashCacheTtlMs = 30000;

let unleashCacheExpireAtMs = 0;
let unleashCacheSnapshot: Record<string, boolean> = {};

/**
 * Resolve variável de ambiente por ordem de precedência.
 * @param keys Lista ordenada de chaves candidatas.
 * @param defaultValue Valor padrão quando nenhuma chave está definida.
 * @returns Valor normalizado (trim).
 */
const readRuntimeEnv = (keys: string[], defaultValue = ""): string => {
  for (const key of keys) {
    const rawValue = process.env[key];
    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      return rawValue.trim();
    }
  }
  return defaultValue;
};

/**
 * Determina se valor desconhecido é objeto indexável.
 * @param value Valor de entrada.
 * @returns `true` quando for um objeto válido.
 */
const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

/**
 * Gera fallback seguro para TTL do cache do provider.
 * @returns TTL em milissegundos.
 */
const getSafeCacheTtlMs = (): number => {
  const rawCacheTtlMs = Number(
    readRuntimeEnv(
      ["NUXT_PUBLIC_UNLEASH_CACHE_TTL_MS", "AURAXIS_UNLEASH_CACHE_TTL_MS"],
      "30000",
    ),
  );
  if (Number.isFinite(rawCacheTtlMs) && rawCacheTtlMs > 0) {
    return Math.trunc(rawCacheTtlMs);
  }
  return defaultUnleashCacheTtlMs;
};

/**
 * Limpa cache do snapshot remoto para testes e invalidacão manual.
 * @returns `void`.
 */
export const resetProviderCache = (): void => {
  unleashCacheSnapshot = {};
  unleashCacheExpireAtMs = 0;
};

/**
 * Retorna o modo de provider configurado para runtime.
 * @returns Modo do provider (`local`, `unleash` ou `posthog`).
 */
export const getProviderMode = (): "local" | "unleash" | "posthog" => {
  const providerModeEnv = readRuntimeEnv(
    ["NUXT_PUBLIC_FLAG_PROVIDER", "AURAXIS_FLAG_PROVIDER"],
    "local",
  )
    .trim()
    .toLowerCase();
  if (providerModeEnv === "unleash") {
    return "unleash";
  }
  if (providerModeEnv === "posthog") {
    return "posthog";
  }
  return "local";
};

/**
 * Monta headers padrão para consulta ao provider Unleash.
 * @returns Dicionário de headers HTTP.
 */
const buildUnleashHeaders = (): Record<string, string> => {
  const unleashAppName = readRuntimeEnv(
    ["NUXT_PUBLIC_UNLEASH_APP_NAME", "AURAXIS_UNLEASH_APP_NAME"],
    defaultUnleashAppName,
  );
  const unleashEnvironment = readRuntimeEnv(
    [
      "NUXT_PUBLIC_UNLEASH_ENVIRONMENT",
      "AURAXIS_UNLEASH_ENVIRONMENT",
      "AURAXIS_RUNTIME_ENV",
    ],
    defaultUnleashEnvironment,
  );
  const unleashInstanceId = readRuntimeEnv(
    ["NUXT_PUBLIC_UNLEASH_INSTANCE_ID", "AURAXIS_UNLEASH_INSTANCE_ID"],
    defaultUnleashInstanceId,
  );
  const unleashClientKey = readRuntimeEnv(
    [
      "NUXT_PUBLIC_UNLEASH_CLIENT_KEY",
      "AURAXIS_UNLEASH_CLIENT_KEY",
      "AURAXIS_UNLEASH_API_TOKEN",
    ],
    "",
  );
  const headers: Record<string, string> = {
    Accept: "application/json",
    "UNLEASH-APPNAME": unleashAppName,
    "UNLEASH-INSTANCEID": unleashInstanceId,
    "UNLEASH-ENVIRONMENT": unleashEnvironment,
  };

  if (unleashClientKey.length > 0) {
    headers.Authorization = unleashClientKey;
  }

  return headers;
};

/**
 * Extrai snapshot de flags do payload do provider Unleash.
 * @param payload Payload bruto retornado pelo provider.
 * @returns Mapa `flag -> enabled`.
 */
const parseUnleashPayload = (payload: unknown): Record<string, boolean> => {
  if (!isObjectRecord(payload) || !Array.isArray(payload.features)) {
    return {};
  }

  const snapshot: Record<string, boolean> = {};
  payload.features.forEach((feature: unknown): void => {
    if (!isObjectRecord(feature)) {
      return;
    }

    const name = String(feature.name ?? "").trim();
    const enabled = feature.enabled;
    if (name.length > 0 && typeof enabled === "boolean") {
      snapshot[name] = enabled;
    }
  });

  return snapshot;
};

/**
 * Consulta snapshot remoto do provider com cache curto em memória.
 * @returns Mapa `flag -> enabled` obtido do provider.
 */
export const fetchUnleashSnapshot = async (): Promise<Record<string, boolean>> => {
  const unleashProxyUrl = readRuntimeEnv(
    ["NUXT_PUBLIC_UNLEASH_PROXY_URL", "AURAXIS_UNLEASH_URL"],
    "",
  );
  if (getProviderMode() !== "unleash" || unleashProxyUrl.length === 0) {
    return {};
  }

  const now = Date.now();
  if (now < unleashCacheExpireAtMs) {
    return unleashCacheSnapshot;
  }

  const response = await fetch(`${unleashProxyUrl}/api/client/features`, {
    method: "GET",
    headers: buildUnleashHeaders(),
  });

  if (!response.ok) {
    return {};
  }

  const payload = await response.json();
  const parsedSnapshot = parseUnleashPayload(payload);
  unleashCacheSnapshot = parsedSnapshot;
  unleashCacheExpireAtMs = now + getSafeCacheTtlMs();
  return parsedSnapshot;
};

/**
 * Consulta a decisão de uma flag no cliente PostHog já inicializado pelo
 * plugin `posthog.client.ts`. Retorna `undefined` quando o SDK não está
 * carregado (plugin inerte sem `NUXT_PUBLIC_POSTHOG_API_KEY`, execução em
 * SSR ou flag ainda não resolvida pelo primeiro fetch).
 *
 * Import dinâmico intencional: mantém `posthog-js` fora do bundle SSR e
 * permite fallback silencioso quando o módulo falha ao carregar.
 * @param flagKey Chave lógica da flag.
 * @returns Valor booleano da flag ou `undefined` quando indisponível.
 */
export const resolvePostHogDecision = async (
  flagKey: string,
): Promise<boolean | undefined> => {
  try {
    const posthogModule = (await import("posthog-js")) as {
      default?: { __loaded?: boolean; isFeatureEnabled?: (k: string) => boolean | undefined };
    };
    const posthog = posthogModule.default;
    if (!posthog || posthog.__loaded !== true || typeof posthog.isFeatureEnabled !== "function") {
      return undefined;
    }
    const value = posthog.isFeatureEnabled(flagKey);
    return typeof value === "boolean" ? value : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Resolve decisão do provider remoto para uma flag.
 * Despacha para Unleash ou PostHog conforme o modo configurado.
 * @param flagKey Chave lógica da flag.
 * @returns Valor booleano do provider quando disponível.
 */
export const resolveProviderDecision = async (
  flagKey: string,
): Promise<boolean | undefined> => {
  const mode = getProviderMode();

  if (mode === "posthog") {
    return resolvePostHogDecision(flagKey);
  }

  if (mode !== "unleash") {
    return undefined;
  }

  try {
    const snapshot = await fetchUnleashSnapshot();
    const providerValue = snapshot[flagKey];
    if (typeof providerValue === "boolean") {
      return providerValue;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Normaliza a chave de flag para o padrão de env var.
 * @param flagKey Chave lógica da flag.
 * @returns Sufixo de variável de ambiente.
 */
export const toEnvSuffix = (flagKey: string): string => {
  return flagKey.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
};

/**
 * Resolve override de ambiente para uma flag.
 * @param flagKey Chave lógica da flag.
 * @returns Valor booleano explícito ou `undefined` quando ausente/inválido.
 */
export const resolveEnvOverride = (flagKey: string): boolean | undefined => {
  const variableName = `${overridePrefix}${toEnvSuffix(flagKey)}`;
  const rawValue = String(process.env[variableName] ?? "").trim().toLowerCase();

  if (rawValue.length === 0) {
    return undefined;
  }

  if (["1", "true", "yes", "on"].includes(rawValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(rawValue)) {
    return false;
  }

  return undefined;
};

/**
 * Busca uma flag no catálogo local versionado.
 * @param flagKey Chave lógica da flag.
 * @returns Definição da flag quando encontrada.
 */
export const getLocalFlag = (flagKey: string): FeatureFlagDefinition | undefined => {
  return featureFlagsCatalog.flags.find((flag: FeatureFlagDefinition): boolean => {
    return flag.key === flagKey;
  });
};

/**
 * Resolve o estado efetivo de uma flag.
 * Prioridade: provider externo -> env override -> catálogo local.
 * @param flagKey Chave lógica da flag.
 * @param providerDecision Decisão opcional de provider externo (Unleash/OpenFeature).
 * @returns `true` quando a feature está habilitada.
 */
export const isFeatureEnabled = (
  flagKey: string,
  providerDecision?: boolean,
): boolean => {
  if (typeof providerDecision === "boolean") {
    return providerDecision;
  }

  const envOverride = resolveEnvOverride(flagKey);
  if (typeof envOverride === "boolean") {
    return envOverride;
  }

  const localFlag = getLocalFlag(flagKey);
  if (!localFlag) {
    return false;
  }

  return isStatusEnabledForEnv(localFlag.status);
};
