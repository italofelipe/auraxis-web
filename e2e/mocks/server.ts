import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW server instance for Node.js (Playwright E2E environment).
 *
 * This server intercepts outbound HTTP requests at the Node level using
 * `@mswjs/interceptors` — no service worker is involved. It is started by
 * `e2e/setup/global-setup.ts` before any Playwright test runs, and stopped
 * after the full suite completes.
 *
 * Usage in tests:
 *   - Default handlers in `handlers.ts` cover all happy-path scenarios.
 *   - To override a handler for a single test use `server.use(...)` inside the
 *     test, then call `server.resetHandlers()` in `afterEach`.
 */
export const server = setupServer(...handlers);
