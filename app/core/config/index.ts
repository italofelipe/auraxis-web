import { useRuntimeConfig } from "#app";

/**
 * Resolved runtime configuration for the Auraxis web app.
 * Typed wrapper around `useRuntimeConfig()` public fields.
 */
export interface AuraxisPublicConfig {
  apiBase: string;
  mockData: string;
  sentryDsn: string;
  siteUrl: string;
}

/**
 * Returns the typed public runtime config.
 * Must be called inside a Nuxt context (setup, plugin, middleware).
 * @returns Typed public runtime configuration object.
 */
export const useAuraxisConfig = (): AuraxisPublicConfig => {
  const config = useRuntimeConfig();
  const pub = config.public as Record<string, unknown>;
  return {
    apiBase: (pub.apiBase as string) ?? "",
    mockData: (pub.mockData as string) ?? "false",
    sentryDsn: (pub.sentryDsn as string) ?? "",
    siteUrl: (pub.siteUrl as string) ?? "",
  };
};

/**
 * Returns true when explicit mock mode is active.
 * Never true in production.
 * @returns True when NUXT_PUBLIC_MOCK_DATA equals "true".
 */
export const isMockDataEnabled = (): boolean => {
  return useAuraxisConfig().mockData === "true";
};
