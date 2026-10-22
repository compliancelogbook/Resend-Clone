/** Newsletter lists, shared by the page and the server so they always agree. */
export const NEWSLETTER_LISTS = [
  { id: "weekly", name: "The Weekly Brief", detail: "The week's marketplace insights and agentic commerce news, every Monday." },
  { id: "daily", name: "Daily Brief", detail: "Every weekday morning, for people who want it all as it happens." },
  { id: "updates", name: "Product Updates", detail: "New EasyFeezy features and early access to Scan and Readiness." },
] as const;

export type NewsletterListId = (typeof NEWSLETTER_LISTS)[number]["id"];
export const NEWSLETTER_LIST_IDS = NEWSLETTER_LISTS.map((l) => l.id) as NewsletterListId[];
