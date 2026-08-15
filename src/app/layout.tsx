import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSVP — asianpaper",
  description: "RSVP for Friday 21 August 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
