import { beforeEach, describe, expect, it, vi } from "vitest";
import { createToken, handleConfirm, handleSubscribe, readToken, resetSubscribeRateLimit, TOKEN_TTL_MS, validateSubscribe } from "../subscribe";

const env = {
  RESEND_API_KEY: "re_test",
  SUBSCRIBE_SECRET: "a-long-random-secret",
  SITE_URL: "http://localhost:5173/",
  RESEND_TOPIC_WEEKLY: "topic_weekly",
  RESEND_TOPIC_DAILY: "topic_daily",
  RESEND_TOPIC_UPDATES: "topic_updates",
};
const okFetch = () => vi.fn(async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;
const calls = (f: typeof fetch) => (f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;

beforeEach(() => resetSubscribeRateLimit());

describe("newsletter sign-up", () => {
  it("needs a valid email, at least one list and explicit consent", () => {
    const r = validateSubscribe({ email: "nope", lists: [], consent: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["consent", "email", "lists"]);
    const good = validateSubscribe({ email: " Sam@Example.com ", lists: ["weekly", "weekly", "bogus"], consent: true });
    expect(good.ok && good.data).toEqual({ email: "sam@example.com", lists: ["weekly"] });
  });

  it("sends a confirmation email and adds nobody to a list yet", async () => {
    const f = okFetch();
    const res = await handleSubscribe({ email: "sam@example.com", lists: ["weekly", "updates"], consent: true }, "1.1.1.1", env, f);
    expect(res.status).toBe(200);
    expect(calls(f)).toHaveLength(1);
    const [url, init] = calls(f)[0];
    expect(url).toBe("https://api.resend.com/emails");
    const sent = JSON.parse(init.body as string);
    expect(sent.to).toEqual(["sam@example.com"]);
    expect(sent.text).toContain("The Weekly Brief, Product Updates");
    expect(sent.text).toContain("http://localhost:5173/api/subscribe/confirm?token=");
  });

  it("creates one contact opted in to only the chosen Topics once they click the link", async () => {
    const token = createToken({ email: "sam@example.com", lists: ["weekly", "updates"] }, env.SUBSCRIBE_SECRET);
    const f = okFetch();
    expect(await handleConfirm(token, env, f)).toBe("/subscribed?status=ok&lists=weekly,updates");
    expect(calls(f)).toHaveLength(1);
    const [url, init] = calls(f)[0];
    expect(url).toBe("https://api.resend.com/contacts");
    expect(JSON.parse(init.body as string)).toEqual({
      email: "sam@example.com",
      unsubscribed: false,
      topics: [
        { id: "topic_weekly", subscription: "opt_in" },
        { id: "topic_updates", subscription: "opt_in" },
      ],
    });
  });

  it("updates an existing contact's Topics instead of failing", async () => {
    const token = createToken({ email: "sam@example.com", lists: ["daily"] }, env.SUBSCRIBE_SECRET);
    const f = vi.fn(async (url: string) => new Response("{}", { status: url === "https://api.resend.com/contacts" ? 409 : 200 })) as unknown as typeof fetch;
    expect(await handleConfirm(token, env, f)).toBe("/subscribed?status=ok&lists=daily");
    const c = calls(f);
    expect(c.map(([u, i]) => `${i.method} ${u}`)).toEqual([
      "POST https://api.resend.com/contacts",
      "PATCH https://api.resend.com/contacts/sam%40example.com",
      "PATCH https://api.resend.com/contacts/sam%40example.com/topics",
    ]);
    expect(JSON.parse(c[2][1].body as string)).toEqual({ topics: [{ id: "topic_daily", subscription: "opt_in" }] });
  });

  it("rejects edited, forged and expired links", async () => {
    const token = createToken({ email: "sam@example.com", lists: ["weekly"] }, env.SUBSCRIBE_SECRET, 1_000);
    const [payload, mac] = token.split(".");
    const edited = `${Buffer.from(JSON.stringify({ e: "evil@x.com", l: ["daily"], t: 1_000 })).toString("base64url")}.${mac}`;
    expect(readToken(edited, env.SUBSCRIBE_SECRET, 2_000)).toEqual({ ok: false, reason: "invalid" });
    expect(readToken(`${payload}.forged`, env.SUBSCRIBE_SECRET, 2_000)).toEqual({ ok: false, reason: "invalid" });
    expect(readToken(token, env.SUBSCRIBE_SECRET, 1_000 + TOKEN_TTL_MS + 1)).toEqual({ ok: false, reason: "expired" });
    expect(readToken(token, env.SUBSCRIBE_SECRET, 2_000).ok).toBe(true);
    const f = okFetch();
    expect(await handleConfirm("garbage", env, f)).toBe("/subscribed?status=invalid");
    expect(f).not.toHaveBeenCalled();
  });

  it("says so honestly when sign-ups aren't connected", async () => {
    const res = await handleSubscribe({ email: "sam@example.com", lists: ["daily"], consent: true }, "1.1.1.2", { RESEND_API_KEY: "x" }, okFetch());
    expect(res.status).toBe(503);
  });

  it("quietly drops bots that fill the hidden field", async () => {
    const f = okFetch();
    const res = await handleSubscribe({ email: "bot@example.com", lists: ["weekly"], consent: true, company: "x" }, "1.1.1.3", env, f);
    expect(res.status).toBe(200);
    expect(f).not.toHaveBeenCalled();
  });
});
