"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const highlights = [
  "Approve and release result batches from one control room",
  "Track delivery outcomes across WhatsApp, Email, and SMS",
  "Maintain audit visibility with secure tokenized result links",
];

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/admin/dashboard",
    });

    setPending(false);

    if (!response || response.error) {
      setError("Invalid super-admin credentials.");
      return;
    }

    router.push(response.url ?? "/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="dashboard-root min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="dashboard-grid-overlay" aria-hidden="true" />

      <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-(--border-subtle) bg-(--surface-strong) shadow-[0_25px_60px_-36px_rgba(2,23,23,0.72)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-2">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,var(--hero-deep),var(--hero-mid)_52%,var(--hero-accent))] p-7 text-(--hero-text) sm:p-10">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.32),transparent_68%)]" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(252,211,77,0.25),transparent_72%)]" />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--hero-kicker)">
              Secure Access
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-(--hero-text) sm:text-4xl">
              Result Notification Control Center
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-(--hero-subtle)">
              Centralized super-admin workspace for approvals, dispatch orchestration,
              delivery tracking, and compliance visibility.
            </p>

            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-(--hero-subtle)">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-10 text-xs font-medium uppercase tracking-[0.14em] text-(--hero-kicker)">
              Access limited to authorized super-admin accounts
            </p>
          </div>
        </div>

        <div className="flex items-center bg-(--surface-strong) p-6 sm:p-10">
          <div className="w-full">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Super Admin Sign-In
            </h2>
            <p className="mt-3 text-sm text-(--text-secondary)">
              Sign in to continue managing result approvals, dispatch jobs, and audit logs.
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-(--text-secondary)">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-(--border-subtle) bg-white px-3 py-2.5 text-sm text-foreground outline-none ring-0 transition focus:border-(--border-strong)"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-(--text-secondary)">Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-(--border-subtle) bg-white px-3 py-2.5 text-sm text-foreground outline-none ring-0 transition focus:border-(--border-strong)"
                />
              </label>

              {error ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-[linear-gradient(120deg,var(--accent-strong),var(--accent-soft))] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {pending ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
