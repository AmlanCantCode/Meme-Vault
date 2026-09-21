import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_MEMES } from "@/data/memes";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MemeDetailPage({ params }: Props) {
  const { slug } = await params;
  const meme = MOCK_MEMES.find((m) => m.slug === slug);

  if (!meme) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-emerald-400 mb-6 text-sm font-medium transition-colors"
        >
          ← Back to Vault
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Video Player & Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl">
              <video
                src={meme.videoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {meme.title}
            </h1>

            <div className="flex gap-2 flex-wrap">
              {meme.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full border border-neutral-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Sidebar with Download & Ad Unit */}
          <div className="space-y-6 bg-neutral-900/60 p-6 rounded-2xl border border-neutral-800">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                Download Asset
              </h2>
              <a
                href={meme.videoUrl}
                download
                className="w-full block text-center bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
              >
                Download MP4 File
              </a>
            </div>

            {/* Ad Placeholder */}
            <div className="border-2 border-dashed border-neutral-800 rounded-xl p-4 text-center bg-neutral-950/50">
              <span className="text-xs text-neutral-500 block mb-1">
                ADVERTISEMENT
              </span>
              <div className="h-48 flex items-center justify-center text-neutral-600 text-xs">
                [Google AdSense / Banner Placement]
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}