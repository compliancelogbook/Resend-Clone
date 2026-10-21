import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildEmail, handleContact, rateLimited, resetRateLimit, validateContact } from "../contact";

const good = { name: "Sam Seller", email: "sam@example.co.uk", topic: "Feedback", marketplaces: ["eBay", "Vinted"], message: "Love the Compare page, please add Depop." };
const env = { RESEND_API_KEY: "re_test", CONTACT_TO: "inbox@example.com", CONTACT_FROM: "EasyFeezy <hello@example.com>" };
const okFetch = () => vi.fn(async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;

beforeEach(() => resetRateLimit());

describe("contact form", () => {
  it("accepts a valid message and tidies it", () => {
    const r = validateContact({ ...good, name: "  Sam Seller ", marketplaces: ["eBay", "Not a marketplace"] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.name).toBe("Sam Seller");
      expect(r.data.marketplaces).toEqual(["eBay"]);
    }
  });

  it("explains each problem in plain words", () => {
    const r = validateContact({ name: "S", email: "nope", topic: "Spam", message: "hi" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "message", "name", "topic"]);
  });

  it("quietly drops bot submissions that fill the hidden field, without sending", async () => {
    const f = okFetch();
    const res = await handleContact({ ...good, company: "Bot Ltd" }, "1.1.1.1", env, f);
    expect(res.status).toBe(200);
    expect(f).not.toHaveBeenCalled();
  });

  it("sends through Resend with a reply-to of the sender", async () => {
    const f = okFetch();
    const res = await handleContact(good, "1.1.1.2", env, f);
    expect(res.status).toBe(200);
    const [url, init] = (f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const sent = JSON.parse(init.body as string);
    expect(sent.to).toEqual(["inbox@example.com"]);
    expect(sent.reply_to).toBe("sam@example.co.uk");
    expect(sent.subject).toContain("Feedback");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
  });

  it("says so honestly when sending isn't set up, instead of pretending", async () => {
    const res = await handleContact(good, "1.1.1.3", {}, okFetch());
    expect(res.status).toBe(503);
    expect(res.json.ok).toBe(false);
  });

  it("reports a failure when Resend rejects the email", async () => {
    const bad = vi.fn(async () => new Response("{}", { status: 422 })) as unknown as typeof fetch;
    const res = await handleContact(good, "1.1.1.4", env, bad);
    expect(res.status).toBe(502);
  });

  it("limits each IP to 5 messages per 10 minutes", () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rateLimited("9.9.9.9", now + i)).toBe(false);
    expect(rateLimited("9.9.9.9", now + 10)).toBe(true);
    expect(rateLimited("9.9.9.9", now + 10 * 60 * 1000 + 10)).toBe(false);
  });

  it("builds a readable plain-text email", () => {
    const e = buildEmail({ ...good, topic: "Feedback" }, "from@x.com", "to@x.com");
    expect(e.text).toContain("Marketplaces: eBay, Vinted");
    expect(e.text).toContain("please add Depop");
  });
});
