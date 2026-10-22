/** Blog content model. Posts are typed data so every story carries its sources. */

export const BLOG_CATEGORIES = ["Daily Brief", "Marketplace Insights", "Agentic Commerce", "News", "Product Updates"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const CATEGORY_SLUGS: Record<BlogCategory, string> = {
  "Daily Brief": "daily-brief",
  "Marketplace Insights": "marketplace-insights",
  "Agentic Commerce": "agentic-commerce",
  News: "news",
  "Product Updates": "product-updates",
};

export interface Source {
  name: string;
  url?: string;
  /** Publication or data date, as written by the source. */
  date?: string;
}

export interface Stat {
  value: string;
  label: string;
}

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] }
  | { type: "takeaways"; items: string[] }
  | { type: "callout"; title: string; text: string }
  | { type: "cta"; label: string; href: string; text?: string }
  | {
      type: "story";
      title: string;
      /** Short status label, e.g. "Accelerating", "Live in the US". */
      status?: string;
      body: string[];
      stats?: Stat[];
      /** A caveat about the evidence: what it does and doesn't show. */
      caveat?: string;
      sources: Source[];
      /** True once a person has checked the claims against the linked sources. */
      verified: boolean;
    };

export interface BlogPost {
  slug: string;
  category: BlogCategory;
  /** YYYY-MM-DD, UK date the post covers. */
  date: string;
  title: string;
  summary: string;
  readMinutes: number;
  /** Drafts show on localhost for review but never in a production build. */
  status: "draft" | "published";
  blocks: Block[];
}
