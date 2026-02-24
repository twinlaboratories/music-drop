import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "holding on — TheTwins ft. Rada",
  description: "Pre-save 'holding on' by TheTwins ft. Rada. New music dropping soon.",
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
