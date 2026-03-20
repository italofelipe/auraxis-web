const REDIRECT_KEY = "auraxis:auth:redirect";
const FALLBACK_PATH = "/dashboard";

export interface AuthRedirectContext {
  /** Persists the current URL as the post-login destination. */
  saveRedirect(path: string): void
  /** Consumes and returns the saved path (cleared after read). Returns fallback if nothing is saved. */
  consumeRedirect(): string
  /** Reads without consuming. */
  peekRedirect(): string | null
  /** Explicitly removes the saved redirect. */
  clearRedirect(): void
}

/**
 * Composable that manages the post-authentication redirect context.
 * Persists to sessionStorage to survive reloads within the same tab.
 *
 * @returns A set of operations to save, consume and clear the auth redirect.
 */
export function useAuthRedirectContext(): AuthRedirectContext {
  const isClient = typeof window !== "undefined";

  /**
   * Saves the post-login destination path.
   * Paths that do not start with "/" are ignored and replaced with the fallback.
   * @param path - Absolute destination path (must start with "/").
   */
  const saveRedirect = (path: string): void => {
    if (!isClient) {
      return;
    }
    const safe = path.startsWith("/") ? path : FALLBACK_PATH;
    sessionStorage.setItem(REDIRECT_KEY, safe);
  };

  /**
   * Reads and removes the saved path.
   * Returns the fallback "/dashboard" if no path is stored.
   * @returns The saved path or "/dashboard" as fallback.
   */
  const consumeRedirect = (): string => {
    if (!isClient) {
      return FALLBACK_PATH;
    }
    const saved = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    return saved ?? FALLBACK_PATH;
  };

  /**
   * Reads the saved path without removing it.
   * @returns The saved path or null if none exists.
   */
  const peekRedirect = (): string | null => {
    if (!isClient) {
      return null;
    }
    return sessionStorage.getItem(REDIRECT_KEY);
  };

  /**
   * Explicitly removes the saved redirect.
   */
  const clearRedirect = (): void => {
    if (!isClient) {
      return;
    }
    sessionStorage.removeItem(REDIRECT_KEY);
  };

  return { saveRedirect, consumeRedirect, peekRedirect, clearRedirect };
}
