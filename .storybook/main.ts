import type { StorybookConfig } from "@storybook-vue/nuxt";

const config: StorybookConfig = {
  stories: [
    "../app/**/*.stories.@(js|ts)",
    "../app/**/*.stories.mdx",
  ],
  addons: [
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook-vue/nuxt",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};

export default config;
