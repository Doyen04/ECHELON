"use client";

import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock login delay
    setTimeout(() => {
      router.push("/admin/dashboard");
    }, 1000);
  };

  return (
    <div className="flex min-h-screen w-full font-sans page-transition-enter">
      
      {/* Left Branding Panel (40%) */}
      <div className="hidden lg:flex w-[40%] bg-brand relative flex-col justify-between p-12 overflow-hidden">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-white/10 shrink-0">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <span className="font-serif text-2xl tracking-wide text-white">
            ECHELON
          </span>
        </div>

        <div className="relative z-10">
          <h1 className="font-serif text-4xl leading-tight text-white mb-4">
            Result Notification System
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Senate-approved results, delivered to every parent securely and seamlessly.
          </p>
        </div>
      </div>

      {/* Right Form Panel (60%) */}
      <div className="flex w-full lg:w-[60%] bg-[#faf9f7] items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          <div className="space-y-3">
            {/* Mobile logo only shown when left panel is hidden */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-brand shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="font-serif text-xl tracking-wide text-foreground">
                ECHELON
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-[32px] text-foreground">
              Sign in to your account
            </h2>
            <p className="text-sm text-text-muted">
              Enter your official credentials to access the admin dashboard.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Email address</label>
                <input 
                  required
                  type="email"
                  placeholder="registrar@echelon.edu.ng"
                  autoComplete="email"
                  className="w-full h-11 border border-border-subtle rounded bg-white px-4 text-foreground focus:outline-none focus:ring-1 focus:border-brand focus:ring-brand transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Password</label>
                <input 
                  required
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-11 border border-border-subtle rounded bg-white px-4 text-foreground focus:outline-none focus:ring-1 focus:border-brand focus:ring-brand transition-all shadow-sm"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="relative w-full flex items-center justify-center h-12 rounded bg-brand px-4 text-sm font-medium text-white shadow hover:bg-brand-hover transition-all disabled:opacity-70"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : "Sign In"}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
