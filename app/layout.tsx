import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./erp-extra.css";
import "./erp-responsive.css";

export const metadata: Metadata = {
  title: "AAU Chamo | Operations Suite",
  description: "Centralized inventory, sales, cargo, finance and operations management for AAU Chamo.",
  applicationName: "AAU Chamo Operations Suite",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1f3a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
