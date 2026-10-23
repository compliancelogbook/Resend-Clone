import { describe, expect, it } from "vitest";
import { AFFILIATE, PRIVACY, TERMS } from "./legal";

const text = (d: { sections: { body: string[] }[] }) => d.sections.flatMap((s) => s.body).join(" ");

describe("legal pages", () => {
  it("name the company and number", () => {
    for (const d of [PRIVACY, TERMS]) expect(text(d)).toContain("Compliance Logbook Ltd (company number 16932013)");
  });
  it("privacy covers the contact form, newsletter consent and Resend", () => {
    const t = text(PRIVACY);
    expect(t).toMatch(/contact form/);
    expect(t).toMatch(/lawful basis is your consent/);
    expect(t).toMatch(/unsubscribe/);
    expect(t).toMatch(/Resend/);
    expect(t).toMatch(/United States/);
  });
  it("affiliate disclosure promises commissions never change results", () => {
    expect(text(AFFILIATE)).toMatch(/never affect our calculations/);
  });
  it("is dated", () => {
    for (const d of [PRIVACY, TERMS, AFFILIATE]) expect(d.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
