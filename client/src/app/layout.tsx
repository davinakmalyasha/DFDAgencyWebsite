import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.FRONTEND_URL || "http://localhost:3000"),
  title: {
    default: "DFD Agency | High-Performance Digital Solutions",
    template: "%s | DFD Agency"
  },
  description: "Elite Software Architecture and Senior TypeScript Development for modern enterprises. We build decoupled, high-performance web applications using Next.js and Express.",
  keywords: ["Software Architect", "Next.js", "Express.js", "TypeScript", "Digital Agency", "Web Development", "DFD Agency"],
  authors: [{ name: "DFD Agency" }],
  creator: "DFD Agency",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "DFD Agency",
    title: "DFD Agency | Digital Solutions Studio",
    description: "Architecting high-performance digital experiences for modern enterprises.",
    images: [
      {
        url: "/og-image.png", // We should ensure an OG image exists or generate one
        width: 1200,
        height: 630,
        alt: "DFD Agency Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DFD Agency | Elite Software Studio",
    description: "High-performance Next.js & Express solutions for modern businesses.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  }
};

import { SmoothScrolling } from "@/components/providers/SmoothScrolling";
import { Toaster } from "@/components/ui/sonner";
import { NetworkStatus } from "@/components/ui/network-status";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} font-sans antialiased bg-zinc-50 text-zinc-950`}>
        <SmoothScrolling>
          {children}
        </SmoothScrolling>
        <Toaster position="top-right" />
        <NetworkStatus />
      </body>
    </html>
  );
}
