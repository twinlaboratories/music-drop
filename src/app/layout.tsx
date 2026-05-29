import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Twins Store",
  description: "Pre-save 'holding on' by TheTwins ft. Rada. New music dropping soon.",
  openGraph: {
    title: "The Twins Store",
  },
  twitter: {
    title: "The Twins Store",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white selection:bg-brand-pink selection:text-white">
        {children}
      </body>
    </html>
  );
}
