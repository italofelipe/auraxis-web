/**
 * useCaptcha — Cloudflare Turnstile integration composable.
 *
 * Lazily injects the Turnstile script on first use and exposes a single
 * `execute()` function that returns a one-time token to send with form
 * submissions. The widget runs in invisible mode — no user interaction needed.
 *
 * Usage:
 *   const { execute } = useCaptcha();
 *   const token = await execute();
 *   // include token in API request body as `captchaToken`
 *
 * The CLOUDFLARE_TURNSTILE_SITE_KEY env var must be set.
 * If it is empty (local dev without a key) execute() resolves to null and the
 * form still submits — the backend must accept a null token in dev mode.
 *
 * Fallback: if the Turnstile script fails to load (network error, ad-blocker)
 * execute() resolves to null so the form always succeeds; rate-limiting on the
 * backend acts as the last line of defence.
 */

interface TurnstileRenderOptions {
  sitekey: string;
  size?: "normal" | "compact" | "invisible" | "flexible";
  execution?: "render" | "execute";
  theme?: "auto" | "light" | "dark";
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: TurnstileRenderOptions) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

/**
 * Injects the Turnstile script tag once per page load (explicit render mode).
 *
 * @returns Promise that resolves when the script has loaded (or immediately if
 *   already loaded). Resolves gracefully on load error so the form is never blocked.
 */
function loadScript(): Promise<void> {
  if (scriptLoaded || typeof document === "undefined") {
    return Promise.resolve();
  }
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }
  scriptLoadPromise = new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = (): void => {
      scriptLoaded = true;
      resolve();
    };
    // Graceful degradation: if the script fails (e.g. ad-blocker), resolve so
    // the form submission is not permanently blocked.
    script.onerror = (): void => resolve();
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

/**
 * Composable that wraps Cloudflare Turnstile in invisible mode and exposes an
 * `execute` helper returning a single-use token per form submission.
 *
 * @returns Object with the `execute` function.
 */
export function useCaptcha(): { execute: () => Promise<string | null> } {
  const config = useRuntimeConfig();
  const siteKey = config.public.turnstileSiteKey as string;

  let widgetId: string | null = null;
  let containerEl: HTMLElement | null = null;

  /**
   * Creates (once) and returns a hidden container element appended to document.body.
   *
   * @returns The existing or newly created container element.
   */
  function getContainer(): HTMLElement {
    if (containerEl) {
      return containerEl;
    }
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.display = "none";
    document.body.appendChild(el);
    containerEl = el;
    return el;
  }

  /**
   * Execute a Turnstile invisible challenge and return a one-time token.
   *
   * Each call removes the previous widget and renders a fresh one to guarantee
   * a new valid token even when the same form is submitted multiple times in a
   * single session.
   *
   * @returns Token string, or null when the site key is not configured or the
   *   script fails to load (e.g. ad-blocker).
   */
  async function execute(): Promise<string | null> {
    if (!siteKey) {
      return null;
    }

    await loadScript();

    if (!window.turnstile) {
      return null;
    }

    // Remove previous widget so we get a fresh, unused token.
    if (widgetId !== null) {
      window.turnstile.remove(widgetId);
      widgetId = null;
    }

    return new Promise<string | null>((resolve) => {
      const container = getContainer();

      widgetId = window.turnstile!.render(container, {
        sitekey: siteKey,
        size: "invisible",
        execution: "execute",
        theme: "auto",
        callback: (token: string): void => resolve(token),
        "error-callback": (): void => resolve(null),
        "expired-callback": (): void => resolve(null),
      });

      window.turnstile!.execute(widgetId!);
    });
  }

  return { execute };
}
