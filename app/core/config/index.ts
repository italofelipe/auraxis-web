import { useRuntimeConfig } from "#app";

/**
 * Resolved runtime configuration for the Auraxis web app.
 * Typed wrapper around `useRuntimeConfig()` public fields.
 */
export interface AuraxisPublicConfig {
  apiBase: string;
  mockData: string;
  sentryDsn: string;
  siteSurface: "app" | "marketing" | "landing";
  siteUrl: string;
}

/**
 * Narrows an arbitrary runtime value to a known site surface.
 * Unknown values fall back to the operational app surface.
 * @param value Raw `siteSurface` value from the public runtime config.
 * @returns One of the supported build surfaces.
 */
const resolveSiteSurface = (value: unknown): AuraxisPublicConfig["siteSurface"] => {
  if (value === "marketing" || value === "landing") {
    return value;
  }
  return "app";
};

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
    siteSurface: resolveSiteSurface(pub.siteSurface),
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
