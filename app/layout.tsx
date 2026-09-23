import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meme Vault | Pinterest Style Video Feed",
  description: "A Pinterest-style meme vault for sharing and organizing video memes",
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Monetag In-Page Push Zone (11870384) */}
        <Script
          src="https://alwingulla.com/88/tag.min.js"
          data-zone="11870384"
          strategy="afterInteractive"
        />
        
        {/* Monetag Vignette Banner Zone (11870472) */}
        <Script
          src="https://alwingulla.com/88/tag.min.js"
          data-zone="11870472"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-neutral-950 text-white">
        {children}
        <Analytics />
      </body>
    </html>
  );
}