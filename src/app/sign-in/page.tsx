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
        <main className="min-h-screen w-full bg-background text-foreground">
            <section className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
                <div className="flex items-center bg-(--hero-deep) p-8 text-(--hero-text) sm:p-12 lg:p-16">
                    <div className="w-full max-w-xl">
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

                <div className="flex items-center bg-(--surface-strong) p-8 sm:p-12 lg:p-16">
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
                                className="w-full rounded-xl bg-(--accent-strong) px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-(--hero-mid) disabled:cursor-not-allowed disabled:opacity-70"
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
