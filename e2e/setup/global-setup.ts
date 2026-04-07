import { server } from "../mocks/server";

/**
 * Playwright globalSetup — starts the MSW Node interceptor before any test.
 *
 * Playwright calls this module once before launching browsers. The MSW server
 * is configured to intercept all HTTP(S) requests that originate from the
 * Node process (i.e. requests made by the Nuxt server-side during SSR, and
 * any `fetch`/`axios` calls made from Node-land test helpers).
 *
 * Browser-side requests (fetch/XHR issued by the Vue app running inside the
 * Chromium/Firefox sandbox) are intercepted via `page.route()` or by relying
 * on the Nuxt dev/preview server proxying through Node where MSW is active.
 *
 * @returns A teardown function that Playwright calls after all tests finish.
 */
const globalSetup = (): (() => void) => {
	server.listen({ onUnhandledRequest: "warn" });

	return () => {
		server.close();
	};
};

export default globalSetup;
