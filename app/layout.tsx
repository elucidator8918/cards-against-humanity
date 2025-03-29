import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Cards Against Humanity Online",
  description: "Play Cards Against Humanity with friends online in a fun and hilarious multiplayer experience.",
  keywords: ["Cards Against Humanity", "party game", "multiplayer", "fun card game"],
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/image.png" type="image/png" />
      </head>
      <body className="bg-black text-white">
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
