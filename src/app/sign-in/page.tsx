"use client";

import React, { useState } from "react";
import { Building2, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
            } else if (result?.ok) {
                router.push(callbackUrl);
            }
        } catch {
            setError("An error occurred during sign in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full font-sans page-transition-enter">
            <div className="relative hidden w-[42%] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(29,75,143,0.95),rgba(16,43,80,0.98))] p-12 text-white lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`, backgroundSize: "42px 42px" }} />
                <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
                        <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <span className="font-serif text-2xl tracking-wide text-white">ECHELON</span>
                </div>

                <div className="relative z-10 max-w-md space-y-6">
                    <Badge variant="outline" className="rounded-full border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Secure result operations
                    </Badge>
                    <div className="space-y-4">
                        <h1 className="font-serif text-4xl leading-tight text-white">
                            Result notification management with a cleaner, calmer workflow.
                        </h1>
                        <p className="text-base leading-7 text-white/78">
                            Approvals, batch uploads, and parent delivery stay visible in one place, with a visual system designed to reduce friction.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs uppercase tracking-[0.14em] text-white/65">Approvals</p>
                            <p className="mt-2 text-2xl font-semibold text-white">Live</p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs uppercase tracking-[0.14em] text-white/65">Dispatch</p>
                            <p className="mt-2 text-2xl font-semibold text-white">Tracked</p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                            <p className="text-xs uppercase tracking-[0.14em] text-white/65">Audit</p>
                            <p className="mt-2 text-2xl font-semibold text-white">Ready</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3 text-sm text-white/70">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Super-admin access only</span>
                </div>
            </div>

            <div className="flex w-full items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,246,243,0.96))] p-6 sm:p-10 lg:w-[58%] lg:p-12">
                <Card className="w-full max-w-xl border-border/70 shadow-[0_26px_70px_-48px_rgba(15,23,42,0.45)]">
                    <CardHeader className="space-y-4 p-6 sm:p-8">
                        <div className="flex items-center gap-3 lg:hidden">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <span className="font-serif text-xl tracking-wide text-foreground">ECHELON</span>
                        </div>
                        <div className="space-y-2">
                            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                Administrative access
                            </Badge>
                            <CardTitle className="text-3xl sm:text-[32px]">Sign in to your account</CardTitle>
                            <CardDescription className="text-sm leading-6 text-muted-foreground">
                                Enter your official credentials to access the admin dashboard.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 px-6 pb-8 sm:px-8">
                        <form onSubmit={handleSignIn} className="space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">Email address</label>
                                    <Input
                                        required
                                        type="email"
                                        placeholder="registrar@echelon.edu.ng"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">Password</label>
                                    <Input
                                        required
                                        type="password"
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error ? (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {error}
                                </div>
                            ) : null}

                            <Button type="submit" disabled={loading} className="h-12 w-full rounded-full text-sm shadow-sm">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Signing in
                                    </span>
                                ) : (
                                    "Sign in"
                                )}
                            </Button>
                        </form>

                        <Separator />

                        <p className="text-xs leading-5 text-muted-foreground">
                            Use your institutional credentials. If access fails, verify the email and password assigned by the registry team.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
