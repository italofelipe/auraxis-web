import featureFlagsCatalogJson from "../../../config/feature-flags.json";

import type {
  FeatureFlagCatalog,
  FeatureFlagDefinition,
} from "./types";

const featureFlagsCatalog: FeatureFlagCatalog =
  featureFlagsCatalogJson as FeatureFlagCatalog;
const enabledStatuses = new Set<string>(["active", "released", "enabled"]);
const overridePrefix = "NUXT_PUBLIC_FLAG_";

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
