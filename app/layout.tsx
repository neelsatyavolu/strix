import type { Metadata } from "next";
import Script from "next/script";
import "@/styles/styles.css";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strix — Practice for the SAT",
  description: "Mac-native digital-SAT practice with real questions, adaptive modules, and live tutoring.",
  icons: { icon: "/assets/app-icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        {/* Cookieless, anonymous page-view counts (see /privacy). */}
        <Script src="https://analytics.n3el.dev/p.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
