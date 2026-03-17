import { useRuntimeConfig } from "#app";

/**
 * Returns true when explicit mock mode is enabled via env var.
 * Must never be true in production.
 * @returns True when NUXT_PUBLIC_MOCK_DATA=true.
 */
export const isMockDataEnabled = (): boolean => {
  const config = useRuntimeConfig();
  return (config.public as Record<string, unknown>).mockData === "true";
};
