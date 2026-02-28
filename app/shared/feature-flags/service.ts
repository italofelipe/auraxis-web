import featureFlagsCatalogJson from "../../../config/feature-flags.json";

import type {
  FeatureFlagCatalog,
  FeatureFlagDefinition,
} from "./types";

const featureFlagsCatalog: FeatureFlagCatalog =
  featureFlagsCatalogJson as FeatureFlagCatalog;
const enabledStatuses = new Set<string>(["active", "released", "enabled"]);
const overridePrefix = "NUXT_PUBLIC_FLAG_";
const defaultUnleashAppName = "auraxis-web";
const defaultUnleashEnvironment = "development";
const defaultUnleashInstanceId = "auraxis-web";
const defaultUnleashCacheTtlMs = 30000;

let unleashCacheExpireAtMs = 0;
let unleashCacheSnapshot: Record<string, boolean> = {};

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
  const rawCacheTtlMs = Number(process.env.NUXT_PUBLIC_UNLEASH_CACHE_TTL_MS ?? "30000");
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
 * @returns Modo do provider (`local` ou `unleash`).
 */
export const getProviderMode = (): "local" | "unleash" => {
  const providerModeEnv = String(process.env.NUXT_PUBLIC_FLAG_PROVIDER ?? "local")
    .trim()
    .toLowerCase();
  if (providerModeEnv === "unleash") {
    return "unleash";
  }
  return "local";
};

/**
 * Monta headers padrão para consulta ao provider Unleash.
 * @returns Dicionário de headers HTTP.
 */
const buildUnleashHeaders = (): Record<string, string> => {
  const unleashAppName = String(process.env.NUXT_PUBLIC_UNLEASH_APP_NAME ?? defaultUnleashAppName).trim();
  const unleashEnvironment = String(
    process.env.NUXT_PUBLIC_UNLEASH_ENVIRONMENT ?? defaultUnleashEnvironment,
  ).trim();
  const unleashInstanceId = String(
    process.env.NUXT_PUBLIC_UNLEASH_INSTANCE_ID ?? defaultUnleashInstanceId,
  ).trim();
  const unleashClientKey = String(process.env.NUXT_PUBLIC_UNLEASH_CLIENT_KEY ?? "").trim();
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
  const unleashProxyUrl = String(process.env.NUXT_PUBLIC_UNLEASH_PROXY_URL ?? "").trim();
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
 * Resolve decisão do provider remoto para uma flag.
 * @param flagKey Chave lógica da flag.
 * @returns Valor booleano do provider quando disponível.
 */
export const resolveProviderDecision = async (
  flagKey: string,
): Promise<boolean | undefined> => {
  if (getProviderMode() !== "unleash") {
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

  return enabledStatuses.has(localFlag.status.trim().toLowerCase());
};
