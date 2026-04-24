import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono, IBM_Plex_Sans, Roboto } from "next/font/google";

import { AppSessionProvider } from "@/components/auth/session-provider";

import "./globals.css";
import { cn } from "@/lib/utils";

const robotoHeading = Roboto({subsets:['latin'],variable:'--font-heading'});

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

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
            className={cn("h-full", "antialiased", bodyFont.variable, displayFont.variable, monoFont.variable, "font-sans", ibmPlexSans.variable, robotoHeading.variable)}
        >
            <body className="min-h-full bg-background text-foreground font-sans page-transition-enter">
                <AppSessionProvider>{children}</AppSessionProvider>
            </body>
        </html>
    );
}
