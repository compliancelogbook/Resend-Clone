/**
 * Newsletter sign-up with double opt-in (UK GDPR / PECR):
 *   1. POST /api/subscribe validates the request and emails a confirmation link.
 *      Nobody is added to a list at this point.
 *   2. GET /api/subscribe/confirm?token=… checks the signed link and only then creates the
 *      Resend contact, opted in to the chosen Topics (or updates an existing contact's Topics).
 * The link is signed with SUBSCRIBE_SECRET, so it can't be forged or edited, and expires
 * after 48 hours. Unsubscribing is handled by Resend's own link in every broadcast.
 *
 * Settings (in .env, never committed):
 *   RESEND_API_KEY, CONTACT_FROM            – shared with the contact form
 *   SUBSCRIBE_SECRET                        – any long random string
 *   RESEND_TOPIC_WEEKLY / _DAILY / _UPDATES – Resend Topic IDs, one per list. Create the
 *                                       Topics with default subscription "Opt-out", so
 *                                       people only get the emails they chose.
 *   SITE_URL                                – e.g. http://localhost:5173 or https://easyfeezy.com
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NEWSLETTER_LIST_IDS, NEWSLETTER_LISTS, type NewsletterListId } from "../shared/subscribe-options";

type Env = Record<string, string | undefined>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

const TOPIC_ENV: Record<NewsletterListId, string> = {
  weekly: "RESEND_TOPIC_WEEKLY",
  daily: "RESEND_TOPIC_DAILY",
  updates: "RESEND_TOPIC_UPDATES",
};

export interface SubscribeRequest {
  email: string;
  lists: NewsletterListId[];
}

export function validateSubscribe(input: unknown): { ok: true; data: SubscribeRequest } | { ok: false; errors: Record<string, string>; spam?: boolean } {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (typeof body.company === "string" && body.company.trim() !== "") return { ok: false, errors: {}, spam: true };

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const lists = Array.isArray(body.lists)
    ? Array.from(new Set(body.lists.filter((l): l is NewsletterListId => NEWSLETTER_LIST_IDS.includes(l as NewsletterListId))))
    : [];

  const errors: Record<string, string> = {};
  if (!EMAIL_RE.test(email) || email.length > 200) errors.email = "Enter a valid email address.";
  if (lists.length === 0) errors.lists = "Choose at least one email.";
  if (body.consent !== true) errors.consent = "Tick the box to agree to receive these emails.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { email, lists } };
}

/* ---------- Signed confirmation tokens ---------- */

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export function createToken(data: SubscribeRequest, secret: string, now = Date.now()): string {
  const payload = b64(JSON.stringify({ e: data.email, l: data.lists, t: now }));
  return `${payload}.${sign(payload, secret)}`;
}

export function readToken(token: string, secret: string, now = Date.now()): { ok: true; data: SubscribeRequest } | { ok: false; reason: "invalid" | "expired" } {
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return { ok: false, reason: "invalid" };
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "invalid" };
  try {
    const p = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e: string; l: NewsletterListId[]; t: number };
    if (typeof p.t !== "number" || now - p.t > TOKEN_TTL_MS) return { ok: false, reason: "expired" };
    const checked = validateSubscribe({ email: p.e, lists: p.l, consent: true });
    return checked.ok ? { ok: true, data: checked.data } : { ok: false, reason: "invalid" };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

/* ---------- Rate limit: 5 sign-ups per IP per 10 minutes ---------- */

const hits = new Map<string, number[]>();
export function subscribeRateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  const limited = recent.length >= 5;
  if (!limited) recent.push(now);
  hits.set(ip, recent);
  return limited;
}
export function resetSubscribeRateLimit() {
  hits.clear();
}

/* ---------- Handlers ---------- */

function configured(env: Env, lists: NewsletterListId[]) {
  return Boolean(env.RESEND_API_KEY && env.SUBSCRIBE_SECRET && env.SITE_URL && lists.every((l) => env[TOPIC_ENV[l]]));
}

export function confirmationEmail(data: SubscribeRequest, link: string, from: string) {
  const names = NEWSLETTER_LISTS.filter((l) => data.lists.includes(l.id)).map((l) => l.name);
  const text = [
    "Please confirm your EasyFeezy subscription.",
    "",
    `You asked to receive: ${names.join(", ")}.`,
    "",
    `Confirm here (link expires in 48 hours): ${link}`,
    "",
    "If you didn't ask for this, ignore this email and you won't hear from us.",
  ].join("\n");
  return { from, to: [data.email], subject: "Confirm your EasyFeezy subscription", text };
}

export async function handleSubscribe(body: unknown, ip: string, env: Env, fetchImpl: typeof fetch = fetch): Promise<{ status: number; json: Record<string, unknown> }> {
  const checked = validateSubscribe(body);
  if (!checked.ok && checked.spam) return { status: 200, json: { ok: true } };
  if (!checked.ok) return { status: 400, json: { ok: false, errors: checked.errors } };
  if (subscribeRateLimited(ip)) return { status: 429, json: { ok: false, message: "Please try again in a few minutes." } };
  if (!configured(env, checked.data.lists)) {
    return { status: 503, json: { ok: false, message: "Sign-ups aren't connected yet. Please try again soon." } };
  }

  const link = `${env.SITE_URL!.replace(/\/+$/, "")}/api/subscribe/confirm?token=${createToken(checked.data, env.SUBSCRIBE_SECRET!)}`;
  const from = env.CONTACT_FROM || "EasyFeezy <onboarding@resend.dev>";
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(confirmationEmail(checked.data, link, from)),
    });
    if (!res.ok) {
      console.error(`[subscribe] Resend returned ${res.status}`);
      return { status: 502, json: { ok: false, message: "We couldn't send your confirmation email. Please try again shortly." } };
    }
    return { status: 200, json: { ok: true } };
  } catch {
    return { status: 502, json: { ok: false, message: "We couldn't send your confirmation email. Please try again shortly." } };
  }
}

/** Returns where to send the browser after a confirmation link is clicked. */
export async function handleConfirm(token: string | null, env: Env, fetchImpl: typeof fetch = fetch): Promise<string> {
  if (!token || !env.SUBSCRIBE_SECRET) return "/subscribed?status=invalid";
  const read = readToken(token, env.SUBSCRIBE_SECRET);
  if (!read.ok) return `/subscribed?status=${read.reason}`;
  if (!configured(env, read.data.lists)) return "/subscribed?status=error";

  const headers = { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" };
  const topics = read.data.lists.map((l) => ({ id: env[TOPIC_ENV[l]]!, subscription: "opt_in" as const }));
  try {
    // New subscriber: one contact, opted in to the chosen Topics.
    const created = await fetchImpl("https://api.resend.com/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: read.data.email, unsubscribed: false, topics }),
    });
    if (!created.ok) {
      // Most likely an existing contact (e.g. adding another list later): confirmed
      // consent, so make sure they're subscribed and opt them in to these Topics.
      const id = encodeURIComponent(read.data.email);
      const resub = await fetchImpl(`https://api.resend.com/contacts/${id}`, { method: "PATCH", headers, body: JSON.stringify({ unsubscribed: false }) });
      const upd = await fetchImpl(`https://api.resend.com/contacts/${id}/topics`, { method: "PATCH", headers, body: JSON.stringify({ topics }) });
      if (!resub.ok || !upd.ok) {
        console.error(`[subscribe] Resend contact create ${created.status}, update ${resub.status}/${upd.status}`);
        return "/subscribed?status=error";
      }
    }
    // Consent record: confirmed via double opt-in at this time, for these lists.
    console.info(`[subscribe] confirmed ${new Date().toISOString()} lists=${read.data.lists.join(",")}`);
    return `/subscribed?status=ok&lists=${read.data.lists.join(",")}`;
  } catch {
    return "/subscribed?status=error";
  }
}
