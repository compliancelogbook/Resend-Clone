/** Newsletter lists, shared by the page and the server so they always agree. */
export const NEWSLETTER_LISTS = [
  { id: "weekly", name: "The Weekly Brief", detail: "The week's best marketplace insights and agentic commerce news. One email, every Monday." },
  { id: "daily", name: "Daily Brief", detail: "Every story as it happens. One email each weekday morning." },
  { id: "updates", name: "Product Updates", detail: "New features and early access to Scan and Readiness. A few emails a month." },
] as const;

export type NewsletterListId = (typeof NEWSLETTER_LISTS)[number]["id"];
export const NEWSLETTER_LIST_IDS = NEWSLETTER_LISTS.map((l) => l.id) as NewsletterListId[];
