import { defineContentConfig, defineCollection } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    default: defineCollection({
      type: "page",
      source: "**/*.md",
    }),
  },
});
