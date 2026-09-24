import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

interface Meme {
  id: string;
  title: string;
  category: string;
  tags: string[];
  video_url?: string;
  videoUrl?: string;
  createdAt?: string;
}

// Fetch single meme using the slug/id parameter
async function getMeme(slug: string): Promise<Meme | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/memes`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const memes: Meme[] = data.memes || [];
    return memes.find((m) => m.id === slug) || null;
  } catch (error) {
    console.error("Failed to fetch meme:", error);
    return null;
  }
}

// 1. SEO Metadata (Google & Social Previews)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meme = await getMeme(slug);

  if (!meme) {
    return { title: "Meme Not Found | Meme Vault" };
  }

  const videoUrl = meme.video_url || meme.videoUrl || "";

  return {
    title: `${meme.title} | Meme Vault`,
    description: `Watch and download "${meme.title}". Category: ${meme.category || "General"}`,
    openGraph: {
      title: meme.title,
      description: `Watch and share ${meme.title} on Meme Vault.`,
      type: "video.other",
      videos: [{ url: videoUrl }],
    },
    twitter: {
      card: "player",
      title: meme.title,
      description: `Watch ${meme.title} on Meme Vault`,
    },
  };
}

// 2. Main Page UI
export default async function SingleMemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meme = await getMeme(slug);

  if (!meme) {
    notFound();
  }

  const videoUrl = meme.video_url || meme.videoUrl || "";

  // Google Video Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": meme.title,
    "description": `Watch and download ${meme.title} meme on Meme Vault.`,
    "contentUrl": videoUrl,
    "thumbnailUrl": [
      `${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}/Meme Vault.png`
    ],
    "uploadDate": meme.createdAt || new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-[#121212] text-neutral-100 font-sans flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur-md px-6 py-3 border-b border-neutral-800/60 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image src="/Meme Vault.png" alt="Meme Vault" fill className="object-cover" />
          </div>
          <span className="font-bold text-sm tracking-wide">Meme Vault</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-all"
        >
          ← Back to Vault
        </Link>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="w-full bg-[#181818] rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col md:flex-row">
          <div className="flex-1 bg-black flex items-center justify-center min-h-[300px]">
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full max-h-[70vh] object-contain"
            />
          </div>

          <div className="w-full md:w-80 p-6 flex flex-col justify-between">
            <div>
              {meme.category && (
                <span className="text-[10px] font-bold uppercase text-red-500 tracking-wider bg-red-500/10 px-2.5 py-1 rounded-full inline-block mb-3">
                  {meme.category}
                </span>
              )}
              <h1 className="text-lg font-bold leading-snug mb-3">{meme.title}</h1>

              {meme.tags && meme.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {meme.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-400 font-medium"
                    >
                      #{tag.replace(/^#+/, "")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-neutral-800/60">
              <a
                href={videoUrl}
                download
                className="w-full py-3 px-4 rounded-full font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>📥</span>
                <span>Download Video</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}