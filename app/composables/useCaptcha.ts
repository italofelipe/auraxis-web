/**
 * useCaptcha — reCAPTCHA v3 integration composable.
 *
 * Lazily injects the reCAPTCHA v3 script on first use and exposes a single
 * `execute(action)` function that returns a token to send with form submissions.
 *
 * Usage:
 *   const { execute } = useCaptcha();
 *   const token = await execute("register");
 *   // include token in API request body
 *
 * The NUXT_PUBLIC_RECAPTCHA_SITE_KEY env var must be set.
 * If it is empty (local dev without a key) execute() resolves to null and the
 * form still submits — the backend must accept a null token in dev mode.
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let scriptLoaded = false;

/**
 * Injects the reCAPTCHA v3 script tag once per page load.
 *
 * @param siteKey - reCAPTCHA v3 public site key used in the script URL.
 * @returns Promise that resolves when the script has loaded.
 */
function loadScript(siteKey: string): Promise<void> {
  if (scriptLoaded || typeof document === "undefined") {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = (): void => {
      scriptLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

/**
 * Composable that wraps reCAPTCHA v3 and exposes an `execute` helper.
 *
 * @returns Object with the `execute` function.
 */
export function useCaptcha(): { execute: (action: string) => Promise<string | null> } {
  const config = useRuntimeConfig();
  const siteKey = config.public.recaptchaSiteKey as string;

  /**
   * Execute a reCAPTCHA v3 challenge for the given action.
   *
   * @param action - Alphanumeric label for scoring (e.g. "register", "login").
   * @returns Token string, or null when the site key is not configured.
   */
  async function execute(action: string): Promise<string | null> {
    if (!siteKey) {
      return null;
    }
    await loadScript(siteKey);
    return new Promise<string | null>((resolve) => {
      window.grecaptcha?.ready(async (): Promise<void> => {
        try {
          const token = await window.grecaptcha!.execute(siteKey, { action });
          resolve(token);
        } catch {
          resolve(null);
        }
      });
    });
  }

  return { execute };
}
