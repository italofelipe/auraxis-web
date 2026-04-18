import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { resetProviderCache } from "./service";
import { useFeatureFlag, useFeatureFlagAsync } from "./use-feature-flag";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetProviderCache();
});

describe("useFeatureFlag", () => {
  it("returns false for a draft flag", () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return { enabled: useFeatureFlag("web.pages.investor-profile") };
        },
        template: "<span>{{ enabled }}</span>",
      }),
    );
    expect(wrapper.text()).toBe("false");
  });

  it("returns true when env override is set to true", () => {
    vi.stubEnv("NUXT_PUBLIC_FLAG_WEB_PAGES_INVESTOR_PROFILE", "true");
    const wrapper = mount(
      defineComponent({
        setup() {
          return { enabled: useFeatureFlag("web.pages.investor-profile") };
        },
        template: "<span>{{ enabled }}</span>",
      }),
    );
    expect(wrapper.text()).toBe("true");
  });

  it("returns false for an unknown flag", () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return { enabled: useFeatureFlag("web.tools.nonexistent") };
        },
        template: "<span>{{ enabled }}</span>",
      }),
    );
    expect(wrapper.text()).toBe("false");
  });
});

describe("useFeatureFlagAsync", () => {
  it("starts with local catalog value before provider resolves", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const wrapper = mount(
      defineComponent({
        setup() {
          return useFeatureFlagAsync("web.pages.investor-profile");
        },
        template: "<span>{{ enabled }}</span>",
      }),
    );
    // Before onMounted resolves, value is from local catalog (draft → false)
    expect(wrapper.text()).toBe("false");
  });

  it("updates enabled after provider returns true", async () => {
    vi.stubEnv("NUXT_PUBLIC_FLAG_PROVIDER", "unleash");
    vi.stubEnv("NUXT_PUBLIC_UNLEASH_PROXY_URL", "https://flags.local");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          features: [{ name: "web.pages.investor-profile", enabled: true }],
        }),
      }),
    );

    const wrapper = mount(
      defineComponent({
        setup() {
          return useFeatureFlagAsync("web.pages.investor-profile");
        },
        template: "<span>{{ enabled }}</span>",
      }),
    );

    await vi.waitUntil(() => wrapper.text() === "true");
    expect(wrapper.text()).toBe("true");
  });
});
