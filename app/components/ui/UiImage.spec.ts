import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import UiImage from "./UiImage.vue";

describe("UiImage", () => {
  it("renders an <img> when src is provided", () => {
    const wrapper = mount(UiImage, {
      props: { src: "/avatar.png", alt: "Ana", width: 32, height: 32 },
    });

    expect(wrapper.find("img").exists()).toBe(true);
  });

  it("does not render when src is null", () => {
    const wrapper = mount(UiImage, {
      props: { src: null, alt: "", width: 32, height: 32 },
    });

    expect(wrapper.find("img").exists()).toBe(false);
  });

  it("does not render when src is undefined", () => {
    const wrapper = mount(UiImage, {
      props: { src: undefined, alt: "", width: 32, height: 32 },
    });

    expect(wrapper.find("img").exists()).toBe(false);
  });

  it("applies loading=lazy by default", () => {
    const wrapper = mount(UiImage, {
      props: { src: "/a.png", alt: "a", width: 10, height: 10 },
    });

    expect(wrapper.find("img").attributes("loading")).toBe("lazy");
  });

  it("applies decoding=async by default", () => {
    const wrapper = mount(UiImage, {
      props: { src: "/a.png", alt: "a", width: 10, height: 10 },
    });

    expect(wrapper.find("img").attributes("decoding")).toBe("async");
  });

  it("respects loading=eager override", () => {
    const wrapper = mount(UiImage, {
      props: { src: "/a.png", alt: "a", width: 10, height: 10, loading: "eager" },
    });

    expect(wrapper.find("img").attributes("loading")).toBe("eager");
  });

  it("respects fetchpriority=high override", () => {
    const wrapper = mount(UiImage, {
      props: { src: "/a.png", alt: "a", width: 10, height: 10, fetchpriority: "high" },
    });

    expect(wrapper.find("img").attributes("fetchpriority")).toBe("high");
  });

  it("forwards width and height attributes", () => {
    const wrapper = mount(UiImage, {
      props: { src: "/a.png", alt: "a", width: 64, height: 48 },
    });

    const img = wrapper.find("img");
    expect(img.attributes("width")).toBe("64");
    expect(img.attributes("height")).toBe("48");
  });

  it("forwards alt text", () => {
    const wrapper = mount(UiImage, {
      props: { src: "/a.png", alt: "profile photo", width: 10, height: 10 },
    });

    expect(wrapper.find("img").attributes("alt")).toBe("profile photo");
  });
});
