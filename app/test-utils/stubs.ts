/**
 * Shared Vue component stubs for unit tests.
 *
 * Import these in spec files instead of defining them inline so that
 * SonarCloud does not flag repeated identical blocks as duplicated code.
 *
 * IMPORTANT: Do NOT use vi.mock() inside this file — Vitest hoists vi.mock()
 * calls before imports are resolved, so shared mock factories must be used
 * via dynamic `await import("~/test-utils/stubs")` inside vi.mock() factories.
 */
/* v8 ignore start */

/** Minimal NuxtLink stub for tests that don't need a Nuxt router context. */
export const NuxtLinkStub = {
  template: "<a :href=\"to\" v-bind=\"$attrs\"><slot /></a>",
  props: ["to"],
};

/**
 * NModal stub used in transaction form tests.
 *
 * Renders a div with `data-testid="n-modal"` when `show` is true so that
 * test assertions can locate the modal without a full Naive UI provider.
 */
export const NModalStub = {
  name: "NModal",
  props: { show: Boolean, title: String },
  template:
    "<div v-if=\"show\" data-testid=\"n-modal\"><span>{{ title }}</span><slot /><slot name=\"footer\" /></div>",
};

/* v8 ignore stop */
