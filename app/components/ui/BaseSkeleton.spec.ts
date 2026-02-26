import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import BaseSkeleton from "./BaseSkeleton.vue";

describe("BaseSkeleton", () => {
  it("renderiza placeholder com classe base", () => {
    const wrapper = mount(BaseSkeleton);

    expect(wrapper.classes()).toContain("base-skeleton");
  });
});
