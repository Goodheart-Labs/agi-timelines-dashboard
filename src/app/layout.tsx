import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CSPostHogProvider } from "./providers";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "When Will We Get AGI? | AGI Timelines Dashboard",
  description:
    "Crowd-sourced forecasts for when Artificial General Intelligence (AGI) will arrive. Aggregates Metaculus, Manifold, Kalshi, and more. See the best consensus on AGI timelines.",
  openGraph: {
    title: "When Will We Get AGI? | AGI Timelines Dashboard",
    description:
      "Crowd-sourced forecasts for when Artificial General Intelligence (AGI) will arrive. Aggregates Metaculus, Manifold, Kalshi, and more. See the best consensus on AGI timelines.",
    url: "https://agi.goodheartlabs.com/",
    siteName: "AGI Timelines Dashboard",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "When will we achieve AGI? agi.goodheartlabs.com dashboard preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "When Will We Get AGI? | AGI Timelines Dashboard",
    description:
      "Crowd-sourced forecasts for when Artificial General Intelligence (AGI) will arrive. Aggregates Metaculus, Manifold, Kalshi, and more. See the best consensus on AGI timelines.",
    images: [
      {
        url: "/twitter-image.png",
        alt: "When will we achieve AGI? agi.goodheartlabs.com dashboard preview",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CSPostHogProvider>
          <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
