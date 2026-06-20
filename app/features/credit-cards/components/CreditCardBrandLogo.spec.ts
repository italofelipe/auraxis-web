import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import CreditCardBrandLogo from "./CreditCardBrandLogo.vue";

describe("CreditCardBrandLogo", () => {
  it("maps the brand to its official svg and accessible label", () => {
    const wrapper = mount(CreditCardBrandLogo, { props: { brand: "visa" } });
    const img = wrapper.get("[data-testid='cc-brand-logo']");
    expect(img.attributes("src")).toBe("/assets/card-brands/visa.svg");
    expect(img.attributes("alt")).toBe("Visa");
  });

  it("falls back to the generic logo when brand is null", () => {
    const wrapper = mount(CreditCardBrandLogo, { props: { brand: null } });
    expect(wrapper.get("[data-testid='cc-brand-logo']").attributes("src")).toBe(
      "/assets/card-brands/other.svg",
    );
  });

  it("keeps the 3:2 aspect ratio derived from width", () => {
    const wrapper = mount(CreditCardBrandLogo, { props: { brand: "elo", width: 48 } });
    expect(wrapper.get("[data-testid='cc-brand-logo']").attributes("height")).toBe("32");
  });
});
