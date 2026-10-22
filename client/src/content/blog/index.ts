import { POSTS_2026_10_22 } from "./posts-2026-10-22";
import { CATEGORY_SLUGS, type BlogCategory, type BlogPost } from "./types";

export * from "./types";

/** Every post, newest first. Add each day's file here. */
export const ALL_POSTS: BlogPost[] = [...POSTS_2026_10_22].sort((a, b) => b.date.localeCompare(a.date));

/** Posts a visitor can see: drafts only appear outside production builds, for review. */
export function visiblePosts(includeDrafts: boolean): BlogPost[] {
  return ALL_POSTS.filter((p) => p.status === "published" || includeDrafts);
}

export const SHOW_DRAFTS = !import.meta.env.PROD;

export function categoryFromSlug(slug: string | null): BlogCategory | null {
  const found = (Object.entries(CATEGORY_SLUGS) as [BlogCategory, string][]).find(([, s]) => s === slug);
  return found ? found[0] : null;
}

export function formatPostDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatShortDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
