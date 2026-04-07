# E2E Tests — auraxis-web

Playwright end-to-end test suite with MSW (Mock Service Worker) for API mocking.

## Running tests

```bash
# Run all E2E tests (headless)
pnpm test:e2e

# Interactive UI mode
pnpm test:e2e:ui

# Step-by-step debug
pnpm test:e2e:debug
```

## How MSW works

MSW v2 runs in **Node interceptor mode** (not a service worker). The server
starts in `e2e/setup/global-setup.ts` before any browser is launched.

- `e2e/mocks/handlers.ts` — request handlers (one per endpoint)
- `e2e/mocks/server.ts` — `setupServer()` that spreads all handlers
- `e2e/setup/global-setup.ts` — starts/stops the server around the full suite

Because Playwright tests also run `page.route()` for browser-level interception,
tests that need custom responses per-test use `page.route()` directly.
The MSW Node server handles server-side (`fetch` in Node) requests.

## Adding new mocks

1. Open `e2e/mocks/handlers.ts`.
2. Add a new `http.get(...)` / `http.post(...)` entry inside the `handlers` array.
3. The server automatically picks it up — no other files need changing.

Example:

```typescript
http.get("*/api/new-endpoint", () => {
  return HttpResponse.json({ data: [] }, { status: 200 });
}),
```

## Directory structure

```
e2e/
  mocks/
    handlers.ts        # MSW request handlers
    server.ts          # MSW server (Node interceptor)
  setup/
    global-setup.ts    # Playwright globalSetup entry
  specs/
    auth.spec.ts       # Login / auth redirect flows
    dashboard.spec.ts  # Dashboard load + summary cards
    navigation.spec.ts # Sidebar navigation + route guards
  helpers/
    auth.ts            # waitForHydration, loginAsTestUser
  README.md            # This file
```
