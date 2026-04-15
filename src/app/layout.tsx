import type { Metadata, Viewport } from "next";
import { Outfit, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { getPublicEnv } from "@/lib/env";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CITYGRAM — your city, first",
    template: "%s · CITYGRAM",
  },
  description:
    "A city-first social space. Your home city is the default world — explore everywhere else on purpose.",
  applicationName: "CITYGRAM",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#070b12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const env = getPublicEnv();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${display.variable} font-sans antialiased citygram-body`}
      >
        <ThemeProvider>
          {!env.supabaseConfigured && (
            <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-900 dark:text-amber-100">
              Set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
              <code className="font-mono">.env.local</code> (local) or your host&apos;s env (e.g. Vercel),
              then restart / redeploy.
            </div>
          )}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
