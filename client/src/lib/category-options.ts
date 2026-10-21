/** Searchable category lists shared by the calculator pages and Compare. */
import { EBAY_CATEGORIES } from "@/data/ebay.fees";
import { TIKTOK_CATEGORIES } from "@/data/tiktok.fees";
import { UNSUPPORTED_CATEGORY_ID } from "@/data/types";

export const EBAY_CATEGORY_OPTIONS = [
  ...[...EBAY_CATEGORIES]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((c) => ({
      value: c.id,
      title: c.label,
      detail: [c.officialCategoryId ? `#${c.officialCategoryId}` : null, c.schedule ? c.source.formula : "Rate not confirmed, enter your own"]
        .filter(Boolean)
        .join(" · "),
    })),
  { value: UNSUPPORTED_CATEGORY_ID, title: "Other (not listed)", detail: "Enter the final value fee rate yourself" },
];

export const TIKTOK_CATEGORY_OPTIONS = [
  ...TIKTOK_CATEGORIES.map((c) => {
    const sub = c.subcategoryDisplay ?? c.subcategory;
    const isWhole = c.subcategory === "All";
    return {
      value: c.id,
      title: isWhole ? c.category : sub,
      detail: `${isWhole ? "Whole category" : c.category} · ${Math.round(c.rate * 100)}% commission`,
    };
  }).sort((a, b) => a.title.localeCompare(b.title)),
  { value: UNSUPPORTED_CATEGORY_ID, title: "Other (not listed)", detail: "Enter the commission rate yourself" },
];
