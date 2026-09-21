"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          video_url: videoUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload meme");
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-6">
      {/* Header */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between py-4 border-b border-neutral-800/60">
        <div className="flex items-center space-x-3">
          <Link href="/" className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center font-black text-white text-xl shadow-lg shadow-red-600/30">
            P
          </Link>
          <span className="font-extrabold text-lg tracking-tight">Meme Vault</span>
        </div>
        <Link href="/" className="text-xs text-neutral-400 hover:text-white transition-colors">
          ← Back to feed
        </Link>
      </header>

      {/* Form Container */}
      <main className="max-w-xl w-full mx-auto my-12 bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">Create a New Pin</h1>
        <p className="text-xs text-neutral-400 mb-6">
          Upload your favorite video memes to the vault.
        </p>

        {/* Admin Only Note */}
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-400 flex items-center space-x-2.5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span><strong>Note:</strong> Only the admin of Meme Vault can create more videos.</span>
        </div>

        {error && (
          <div className="mb-4 bg-red-950/50 border border-red-800 text-red-300 text-xs p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. When the code finally works on the first try"
              className="w-full bg-neutral-800 text-xs px-4 py-3 rounded-xl border border-neutral-700 focus:outline-none focus:border-red-500 text-white placeholder-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Programming, Gaming, Anime"
              className="w-full bg-neutral-800 text-xs px-4 py-3 rounded-xl border border-neutral-700 focus:outline-none focus:border-red-500 text-white placeholder-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="coding, bugs, developer"
              className="w-full bg-neutral-800 text-xs px-4 py-3 rounded-xl border border-neutral-700 focus:outline-none focus:border-red-500 text-white placeholder-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Video URL (.mp4)</label>
            <input
              type="url"
              required
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full bg-neutral-800 text-xs px-4 py-3 rounded-xl border border-neutral-700 focus:outline-none focus:border-red-500 text-white placeholder-neutral-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3.5 rounded-full transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? "Publishing..." : "Publish Pin"}
          </button>
        </form>
      </main>

      <footer className="text-center py-6 text-neutral-600 text-xs">
        Meme Vault • Pinterest Style Video Feed
      </footer>
    </div>
  );
}