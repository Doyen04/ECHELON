import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";

import { AppSessionProvider } from "@/components/auth/session-provider";

import "./globals.css";

const bodyFont = DM_Sans({
    variable: "--font-body",
    subsets: ["latin"],
});

const displayFont = DM_Serif_Display({
    variable: "--font-display",
    subsets: ["latin"],
    weight: ["400"],
});

const monoFont = JetBrains_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "Result Notification System",
        template: "%s | Result Notification System",
    },
    description:
        "Secure dashboard for super-admin-approved result delivery to parents via WhatsApp, email, and SMS.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
        >
            <body className="min-h-full bg-[var(--color-bg)] text-[var(--color-text-primary)] font-sans page-transition-enter">
                <AppSessionProvider>{children}</AppSessionProvider>
            </body>
        </html>
    );
}
