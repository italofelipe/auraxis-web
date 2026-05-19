import type { App } from "vue";
import { vi } from "vitest";

/**
 * Installs the minimal Nuxt app context required by page-level head composables
 * in component tests that mount pages outside the full Nuxt runtime.
 *
 * @param app Vue test app instance.
 */
export function nuxtAppContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: {
      path: "/",
      meta: {},
      params: {},
      query: {},
    },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: {
      head: {
        push: vi.fn(() => ({
          patch: vi.fn(),
          dispose: vi.fn(),
        })),
      },
    },
    static: { data: {} },
    isHydrating: false,
    deferHydration: (): void => {},
    runWithContext: <T>(callback: () => T): T => callback(),
    hooks: { callHook: vi.fn(), hook: vi.fn() },
    _asyncDataPromises: {},
    _asyncData: {},
  });
}
