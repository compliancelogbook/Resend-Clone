/**
 * Sign up and log in (design preview). Email link or Google, no passwords.
 * Marketing emails need their own unticked box: account emails don't.
 */
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { Link } from "wouter";
import { BASE } from "./Shell";
import "./auth.css";

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="au">
      <div className="au-top">
        <a href="/" className="au-back"><ArrowLeft size={15} /> easyfeezy.com</a>
      </div>
      <div className="au-card">
        <img className="au-logo" src="/brand/easyfeezy-wordmark.png" alt="EasyFeezy" width={640} height={106} />
        {children}
      </div>
      <p className="au-foot">Preview · nothing is sent from this page</p>
    </main>
  );
}

function CheckEmail({ email, onBack }: { email: string; onBack: () => void }) {
  const [wait, setWait] = useState(30);
  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);
  return (
    <div className="au-sent">
      <span className="au-sent-icon"><MailCheck size={26} /></span>
      <h1>Check your email</h1>
      <p>We've sent a link to <b>{email}</b>. Click it to continue. It works once and expires in 1 hour.</p>
      <button type="button" className="au-btn-ghost" disabled={wait > 0} onClick={() => setWait(30)}>
        {wait > 0 ? `Send again in ${wait}s` : "Send the link again"}
      </button>
      <button type="button" className="au-link" onClick={onBack}>Use a different email</button>
      <small>Can't find it? Check your spam folder. The email comes from hello@easyfeezy.com.</small>
    </div>
  );
}

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function SignUp() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [news, setNews] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => { document.title = "Create your account · EasyFeezy"; }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!validEmail(email)) return setError("Enter an email address like name@example.com.");
    setError("");
    setSent(true);
  };

  return (
    <AuthFrame>
      {sent ? (
        <CheckEmail email={email.trim()} onBack={() => setSent(false)} />
      ) : (
        <>
          <h1>Create your account</h1>
          <p className="au-sub">Free for fee calculators and Compare. No card needed.</p>
          <button type="button" className="au-google"><GoogleMark /> Continue with Google</button>
          <div className="au-or"><span>or</span></div>
          <form onSubmit={submit} noValidate>
            <label className="au-field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jade Collins" />
            </label>
            <label className={`au-field ${error ? "has-error" : ""}`}>
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@yourshop.co.uk" aria-invalid={!!error} />
              {error && <em role="alert">{error}</em>}
            </label>
            <label className="au-check">
              <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} />
              <span>Send me The Weekly Brief and product updates. Unsubscribe any time.</span>
            </label>
            <button type="submit" className="au-btn"><Mail size={16} /> Create account</button>
          </form>
          <p className="au-legal">
            By creating an account you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy policy</a>.
          </p>
          <p className="au-switch">Already have an account? <Link href={`${BASE}/login`}>Log in</Link></p>
        </>
      )}
    </AuthFrame>
  );
}

export function LogIn() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => { document.title = "Log in · EasyFeezy"; }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!validEmail(email)) return setError("Enter the email address you signed up with.");
    setError("");
    setSent(true);
  };

  return (
    <AuthFrame>
      {sent ? (
        <CheckEmail email={email.trim()} onBack={() => setSent(false)} />
      ) : (
        <>
          <h1>Log in to EasyFeezy</h1>
          <p className="au-sub">We'll email you a link. No password to remember.</p>
          <button type="button" className="au-google"><GoogleMark /> Continue with Google</button>
          <div className="au-or"><span>or</span></div>
          <form onSubmit={submit} noValidate>
            <label className={`au-field ${error ? "has-error" : ""}`}>
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@yourshop.co.uk" aria-invalid={!!error} />
              {error && <em role="alert">{error}</em>}
            </label>
            <button type="submit" className="au-btn"><Mail size={16} /> Email me a login link</button>
          </form>
          <p className="au-switch">New to EasyFeezy? <Link href={`${BASE}/signup`}>Create an account</Link></p>
        </>
      )}
    </AuthFrame>
  );
}
