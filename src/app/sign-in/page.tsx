"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    <main className="dashboard-root min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="dashboard-grid-overlay" aria-hidden="true" />

      <section className="mx-auto w-full max-w-md rounded-3xl border border-(--border-subtle) bg-(--surface-strong) p-8 shadow-[0_25px_60px_-36px_rgba(2,23,23,0.72)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
          Secure Access
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          Super Admin Sign-In
        </h1>
        <p className="mt-3 text-sm text-(--text-secondary)">
          Sign in to manage result approvals, dispatch, delivery logs, and audit records.
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
      </section>
    </main>
  );
}
