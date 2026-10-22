import { describe, expect, it } from "vitest";
import { ALL_POSTS, BLOG_CATEGORIES, visiblePosts } from "..";

describe("blog posts", () => {
  it("have unique slugs, valid categories and real dates", () => {
    const slugs = ALL_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of ALL_POSTS) {
      expect(BLOG_CATEGORIES).toContain(p.category);
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(p.date).getTime())).toBe(false);
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("give every story at least one source", () => {
    for (const p of ALL_POSTS) {
      for (const b of p.blocks) {
        if (b.type === "story") expect(b.sources.length, `${p.slug}: ${b.title}`).toBeGreaterThan(0);
      }
    }
  });

  it("never publish a post that still has unchecked stories", () => {
    for (const p of ALL_POSTS.filter((x) => x.status === "published")) {
      const unchecked = p.blocks.filter((b) => b.type === "story" && !b.verified);
      expect(unchecked, `${p.slug} is published with unchecked stories`).toHaveLength(0);
    }
  });

  it("hide drafts from the live site", () => {
    const live = visiblePosts(false);
    expect(live.every((p) => p.status === "published")).toBe(true);
    expect(visiblePosts(true).length).toBe(ALL_POSTS.length);
  });

  it("link internally only to pages that exist", () => {
    const slugs = new Set(ALL_POSTS.map((p) => `/blog/${p.slug}`));
    const pages = new Set(["/compare", "/#agentic", "/etsy-fee-calculator", "/early-access", "/contact"]);
    for (const p of ALL_POSTS) {
      for (const b of p.blocks) {
        if (b.type === "cta") expect(slugs.has(b.href) || pages.has(b.href), `${p.slug} links to ${b.href}`).toBe(true);
      }
    }
  });
});
