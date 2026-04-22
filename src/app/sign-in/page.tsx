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
        <main className="min-h-screen bg-background text-foreground">
            <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
                <aside className="relative flex items-center overflow-hidden bg-[var(--color-accent)] px-8 py-12 text-white sm:px-12 lg:px-16">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.16) 0, transparent 24%), radial-gradient(circle at 90% 0%, rgba(255,255,255,0.12) 0, transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent)" }} />
                    <div className="relative z-10 max-w-xl">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-semibold">
                            RN
                        </div>
                        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
                            Result Notification System
                        </p>
                        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                            Senate-approved results, delivered to every parent.
                        </h1>
                        <p className="mt-5 max-w-md text-sm leading-7 text-white/70 sm:text-base">
                            Centralized super-admin workspace for approvals, dispatch orchestration,
                            delivery tracking, and compliance visibility.
                        </p>

                        <ul className="mt-10 space-y-4">
                            {highlights.map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                <div className="flex items-center px-8 py-12 sm:px-12 lg:px-16">
                    <div className="w-full max-w-xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-secondary)">
                            Secure Access
                        </p>
                        <h2 className="mt-4 font-serif text-[28px] leading-tight text-foreground sm:text-[34px]">
                            Sign in to your account
                        </h2>
                        <p className="mt-3 text-sm text-(--text-secondary)">
                            Direct access for super-admin operations. Use your institution credentials to continue.
                        </p>

                        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-(--text-secondary)">Email</span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="w-full rounded-xl border border-(--border-subtle) bg-white px-3 py-3 text-sm text-foreground outline-none transition focus:border-(--border-strong)"
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
                                    className="w-full rounded-xl border border-(--border-subtle) bg-white px-3 py-3 text-sm text-foreground outline-none transition focus:border-(--border-strong)"
                                />
                            </label>

                            {error ? (
                                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                    {error}
                                </p>
                            ) : null}

                            <button
                                type="submit"
                                disabled={pending}
                                className="w-full rounded-xl bg-(--accent-strong) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--accent-hover) disabled:cursor-not-allowed disabled:opacity-70"
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
