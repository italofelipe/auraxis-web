import { describe, expect, it } from "vitest";
import {
  BLOG_POSTS,
  BLOG_POST_SLUGS,
  getBlogPost,
  getRelatedBlogPosts,
  resolveBlogRobots,
} from "./blogPosts";

describe("SEO blog posts", () => {
  it("publishes a small editorial seed without duplicate slugs", () => {
    expect(BLOG_POST_SLUGS).toEqual([
      "controle-financeiro-sem-planilha-confusa",
      "insights-financeiros-com-contexto",
      "planejamento-financeiro-mensal",
    ]);
    expect(new Set(BLOG_POST_SLUGS).size).toBe(BLOG_POST_SLUGS.length);
    expect(BLOG_POSTS).toHaveLength(BLOG_POST_SLUGS.length);
  });

  it("keeps every post ready for SEO, Article schema and internal links", () => {
    for (const post of BLOG_POSTS) {
      expect(post.title.length).toBeGreaterThan(32);
      expect(post.description.length).toBeGreaterThan(90);
      expect(post.excerpt.length).toBeGreaterThan(80);
      expect(post.keywords.length).toBeGreaterThanOrEqual(2);
      expect(post.sections.length).toBeGreaterThanOrEqual(3);
      expect(post.faq.length).toBeGreaterThanOrEqual(2);
      expect(post.relatedLinks.map((link) => link.to)).toContain("/register");
      expect(getBlogPost(post.slug)).toBe(post);
    }
  });

  it("returns related posts without the current article", () => {
    const related = getRelatedBlogPosts("insights-financeiros-com-contexto");

    expect(related).toHaveLength(2);
    expect(related.map((post) => post.slug)).not.toContain("insights-financeiros-com-contexto");
  });

  it("returns undefined for unknown post slugs", () => {
    expect(getBlogPost("post-inexistente")).toBeUndefined();
  });

  it("indexes only canonical Portuguese marketing routes", () => {
    expect(resolveBlogRobots({ isMarketingSurface: true, routePath: "/blog" })).toBe(
      "index, follow",
    );
    expect(resolveBlogRobots({ isMarketingSurface: true, routePath: "/en/blog" })).toBe(
      "noindex, nofollow",
    );
    expect(resolveBlogRobots({ isMarketingSurface: false, routePath: "/blog" })).toBe(
      "noindex, nofollow",
    );
  });
});
