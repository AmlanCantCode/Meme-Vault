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
        <Script id="monetag-inpage-push" strategy="afterInteractive">
          {`(function(d,z,s){s.src='https://alwingulla.com/88/tag.min.js';s.setAttribute('data-zone',z);(d.head||d.documentElement).appendChild(s);})(document,11870384,document.createElement('script'));`}
        </Script>

        {/* Monetag Vignette Banner Zone (11870472) */}
        <Script id="monetag-vignette" strategy="afterInteractive">
          {`(function(d,z,s){s.src='https://alwingulla.com/88/tag.min.js';s.setAttribute('data-zone',z);(d.head||d.documentElement).appendChild(s);})(document,11870472,document.createElement('script'));`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-neutral-950 text-white">
        {children}
        <Analytics />
      </body>
    </html>
  );
}