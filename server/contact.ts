/**
 * Contact form: validation, a simple per-IP rate limit, and delivery through
 * the Resend email API. Used by the production server (server/index.ts) and the
 * dev server (vite.config.ts) so both behave the same.
 *
 * Settings (in .env, never committed):
 *   RESEND_API_KEY  – Resend API key
 *   CONTACT_TO      – inbox that receives enquiries
 *   CONTACT_FROM    – sender, e.g. "EasyFeezy <hello@yourdomain>" (must be a Resend-verified domain)
 */

import { CONTACT_MARKETPLACES, CONTACT_TOPICS, MESSAGE_MAX } from "../shared/contact-options";

export { CONTACT_MARKETPLACES, CONTACT_TOPICS, MESSAGE_MAX };

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export interface ContactMessage {
  name: string;
  email: string;
  topic: ContactTopic;
  marketplaces: string[];
  message: string;
}

export type ContactErrors = Partial<Record<"name" | "email" | "topic" | "message", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Checks and tidies a submission. The `company` field is a hidden trap for bots. */
export function validateContact(input: unknown): { ok: true; data: ContactMessage } | { ok: false; errors: ContactErrors; spam?: boolean } {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  if (str(body.company) !== "") return { ok: false, errors: {}, spam: true };

  const name = str(body.name);
  const email = str(body.email);
  const topic = str(body.topic);
  const message = str(body.message);
  const marketplaces = Array.isArray(body.marketplaces)
    ? body.marketplaces.filter((m): m is string => typeof m === "string" && (CONTACT_MARKETPLACES as readonly string[]).includes(m))
    : [];

  const errors: ContactErrors = {};
  if (name.length < 2) errors.name = "Enter your name.";
  else if (name.length > 100) errors.name = "Keep your name under 100 characters.";
  if (!EMAIL_RE.test(email) || email.length > 200) errors.email = "Enter a valid email address.";
  if (!(CONTACT_TOPICS as readonly string[]).includes(topic)) errors.topic = "Choose what your message is about.";
  if (message.length < 10) errors.message = "Tell us a little more (at least 10 characters).";
  else if (message.length > MESSAGE_MAX) errors.message = `Keep your message under ${MESSAGE_MAX} characters.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { name, email, topic: topic as ContactTopic, marketplaces, message } };
}

/* ---------- Rate limit: 5 messages per IP per 10 minutes ---------- */

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map<string, number[]>();

export function rateLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export function resetRateLimit() {
  hits.clear();
}

/* ---------- Delivery ---------- */

export function buildEmail(data: ContactMessage, from: string, to: string) {
  const lines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Topic: ${data.topic}`,
    `Marketplaces: ${data.marketplaces.length ? data.marketplaces.join(", ") : "Not given"}`,
    "",
    data.message,
  ];
  return {
    from,
    to: [to],
    reply_to: data.email,
    subject: `EasyFeezy enquiry: ${data.topic} from ${data.name}`,
    text: lines.join("\n"),
  };
}

type Env = Record<string, string | undefined>;

/** The whole request, start to finish. Returns the HTTP status and JSON to send back. */
export async function handleContact(
  body: unknown,
  ip: string,
  env: Env,
  fetchImpl: typeof fetch = fetch,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const checked = validateContact(body);
  // Pretend success for bots, so they don't learn to avoid the trap.
  if (!checked.ok && checked.spam) return { status: 200, json: { ok: true } };
  if (!checked.ok) return { status: 400, json: { ok: false, errors: checked.errors } };

  if (rateLimited(ip)) {
    return { status: 429, json: { ok: false, message: "You've sent a few messages already. Please try again in a few minutes." } };
  }

  const key = env.RESEND_API_KEY;
  const to = env.CONTACT_TO;
  const from = env.CONTACT_FROM || "EasyFeezy <onboarding@resend.dev>";
  if (!key || !to) {
    return { status: 503, json: { ok: false, message: "Our contact form isn't connected yet. Please try again soon." } };
  }

  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildEmail(checked.data, from, to)),
    });
    if (!res.ok) {
      console.error(`[contact] Resend returned ${res.status}`);
      return { status: 502, json: { ok: false, message: "We couldn't send your message just now. Please try again shortly." } };
    }
    return { status: 200, json: { ok: true } };
  } catch {
    console.error("[contact] Could not reach Resend");
    return { status: 502, json: { ok: false, message: "We couldn't send your message just now. Please try again shortly." } };
  }
}
