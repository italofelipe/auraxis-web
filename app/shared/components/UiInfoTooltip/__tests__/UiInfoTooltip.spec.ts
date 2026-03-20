import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import UiInfoTooltip from "../UiInfoTooltip.vue";

describe("UiInfoTooltip", () => {
  it("renders the tooltip trigger accessibly", () => {
    const wrapper = mount(UiInfoTooltip, {
      props: {
        content: "Explica o conceito de valor presente.",
        label: "Entender valor presente",
      },
      global: {
        stubs: {
          NTooltip: {
            template: "<div><slot name='trigger' /><slot /></div>",
          },
          NButton: {
            props: ["text", "type", "ariaLabel"],
            template: "<button :aria-label='ariaLabel'><slot /></button>",
          },
          UiIcon: {
            props: ["name", "size", "decorative", "label"],
            template: "<svg :data-label='label' />",
          },
        },
      },
    });

    expect(wrapper.find("button[aria-label='Entender valor presente']").exists()).toBe(true);
  });

  it("renders the tooltip content", () => {
    const wrapper = mount(UiInfoTooltip, {
      props: {
        content: "Explica o conceito de valor presente.",
      },
      global: {
        stubs: {
          NTooltip: {
            template: "<div><slot name='trigger' /><slot /></div>",
          },
          NButton: {
            template: "<button><slot /></button>",
          },
          UiIcon: {
            template: "<svg />",
          },
        },
      },
    });

    expect(wrapper.props("content")).toBe("Explica o conceito de valor presente.");
  });
});
