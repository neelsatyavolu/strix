import type { Metadata } from "next";
import "@/styles/styles.css";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proctorly — Practice for the SAT",
  description: "Mac-native digital-SAT practice with real questions, adaptive modules, and live tutoring.",
  icons: { icon: "/assets/app-icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
