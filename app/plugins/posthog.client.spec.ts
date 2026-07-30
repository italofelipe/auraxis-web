/* eslint-disable jsdoc/require-jsdoc */
import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMock = vi.hoisted(() => ({
  capture: vi.fn(),
  identify: vi.fn(),
  init: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("posthog-js/dist/module.no-external", () => ({
  default: posthogMock,
}));

// eslint-disable-next-line import/first
import { createConsentAwareAnalyticsClient } from "./posthog.client";
// eslint-disable-next-line import/first
import { resetPostHogSdkLoader } from "~/shared/analytics/posthog-loader";

/**
 * Deixa as continuações do `import()` dinâmico rodarem.
 *
 * O SDK agora chega por promise (#1246), então tudo que o cliente faz com ele
 * acontece um tick depois da chamada. Sem isto os testes afirmariam sobre um
 * estado que ainda não existe — e passariam a esconder exatamente o bug que
 * a mudança poderia introduzir.
 */
const flush = async (): Promise<void> => {
  // `setTimeout` e não só `Promise.resolve()`: resolver um `import()` dinâmico
  // envolve o grafo de módulos, não apenas microtasks — drenar microtask não
  // basta e o teste falharia por timing, não por comportamento.
  for (let index = 0; index < 3; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

interface TestAnalyticsConsentGateway {
  canUseAnalytics(): boolean;
  onChange(listener: (nextAllowed: boolean) => void): () => void;
  setAllowed(nextAllowed: boolean): void;
}

const createGateway = (initialAllowed: boolean): TestAnalyticsConsentGateway => {
  let allowed = initialAllowed;
  const listeners: Array<(allowed: boolean) => void> = [];

  return {
    canUseAnalytics: () => allowed,
    onChange: (listener: (nextAllowed: boolean) => void): (() => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      };
    },
    setAllowed: (nextAllowed: boolean): void => {
      allowed = nextAllowed;
      listeners.forEach((listener) => listener(nextAllowed));
    },
  };
};

describe("PostHog consent gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPostHogSdkLoader();
  });

  it("does not initialize or capture events before analytics consent", async () => {
    const gateway = createGateway(false);
    const client = createConsentAwareAnalyticsClient("ph_test", "https://eu.i.posthog.com", gateway);

    client.capture("dashboard_viewed");
    client.identify("user-123");
    await flush();

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
    expect(posthogMock.identify).not.toHaveBeenCalled();
  });

  it("initializes once and captures after analytics consent is granted", async () => {
    const gateway = createGateway(false);
    const client = createConsentAwareAnalyticsClient("ph_test", "https://eu.i.posthog.com", gateway);

    gateway.setAllowed(true);
    client.capture("dashboard_viewed", { source: "test" });
    client.identify("user-123");
    await flush();

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    // Pageviews are SDK-native (#1208): "history_change" covers the initial
    // full-page load AND SPA navigations — the manual page:finish hook never
    // fired on full-page loads, so the SSG landing captured zero pageviews.
    expect(posthogMock.init).toHaveBeenCalledWith(
      "ph_test",
      expect.objectContaining({ capture_pageview: "history_change" }),
    );
    expect(posthogMock.capture).toHaveBeenCalledWith("dashboard_viewed", { source: "test" });
    expect(posthogMock.identify).toHaveBeenCalledWith("user-123");
  });

  it("stops future analytics events when consent is revoked", async () => {
    const gateway = createGateway(true);
    const client = createConsentAwareAnalyticsClient("ph_test", "https://eu.i.posthog.com", gateway);

    client.capture("dashboard_viewed");
    await flush();
    gateway.setAllowed(false);
    client.capture("portfolio_viewed");
    await flush();

    expect(posthogMock.opt_out_capturing).toHaveBeenCalledOnce();
    expect(posthogMock.reset).toHaveBeenCalledOnce();
    expect(posthogMock.capture).not.toHaveBeenCalledWith("portfolio_viewed", undefined);
  });

  // ── A janela entre o aceite e o SDK chegar (#1246) ───────────────────────
  // É o risco que o import dinâmico cria: com o SDK carregando por promise,
  // eventos disparados no instante do aceite acontecem antes de existir
  // cliente. O funil da landing (#1208) depende de nenhum deles se perder.

  it("does not drop events fired before the SDK finishes loading", async () => {
    const gateway = createGateway(false);
    const client = createConsentAwareAnalyticsClient("ph_test", "https://eu.i.posthog.com", gateway);

    gateway.setAllowed(true);
    // Sem nenhum await no meio: o SDK ainda não resolveu neste ponto.
    client.capture("landing_cta_clicked");
    client.capture("checkout_form_submitted");
    client.capture("checkout_provider_redirected");

    expect(posthogMock.capture).not.toHaveBeenCalled();

    await flush();

    expect(posthogMock.capture).toHaveBeenCalledTimes(3);
  });

  it("preserves the order of events fired during the loading window", async () => {
    const gateway = createGateway(true);
    const client = createConsentAwareAnalyticsClient("ph_test", "https://eu.i.posthog.com", gateway);

    client.capture("landing_cta_clicked");
    client.capture("checkout_form_submitted");
    client.capture("checkout_provider_redirected");
    await flush();

    expect(posthogMock.capture.mock.calls.map(([event]) => event)).toEqual([
      "landing_cta_clicked",
      "checkout_form_submitted",
      "checkout_provider_redirected",
    ]);
  });

  it("initializes the SDK only once when several events race the load", async () => {
    const gateway = createGateway(true);
    const client = createConsentAwareAnalyticsClient("ph_test", "https://eu.i.posthog.com", gateway);

    client.capture("landing_cta_clicked");
    client.capture("checkout_form_submitted");
    client.identify("user-123");
    await flush();

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
  });
});
