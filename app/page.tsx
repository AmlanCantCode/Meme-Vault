"use client";

import { useEffect, useState, useRef, MouseEvent } from "react";
import Link from "next/link";

interface Meme {
  id: string;
  title: string;
  category: string;
  tags: string[];
  video_url?: string;
  videoUrl?: string;
}

export default function Home() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchMemes() {
      try {
        const res = await fetch("/api/memes");
        const data = await res.json();
        if (res.ok) {
          setMemes(data.memes || []);
        }
      } catch (err) {
        console.error("Failed to load memes", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMemes();
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Filter memes based on search input
  const filteredMemes = memes.filter((meme) => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = meme.title?.toLowerCase().includes(query);
    const matchesCategory = meme.category?.toLowerCase().includes(query);
    const matchesTags = meme.tags?.some((tag) => tag.toLowerCase().includes(query));
    return matchesTitle || matchesCategory || matchesTags;
  });

  // Direct download without external preview tab
  const handleDirectDownload = async (e: MouseEvent, videoUrl: string, title: string) => {
    e.stopPropagation();
    setOpenMenuId(null);

    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_") || "meme"}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Direct download failed, falling back to direct link", err);
      window.open(videoUrl, "_blank");
    }
  };

  const copyToClipboard = (e: MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
    setOpenMenuId(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-red-600 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-neutral-950/90 border-b border-neutral-800/60 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center font-black text-white text-xl shadow-lg shadow-red-600/30">
            P
          </div>
          <span className="font-extrabold text-lg tracking-tight">Meme Vault</span>
        </div>

        {/* Working Search Bar */}
        <div className="flex-1 max-w-2xl mx-8 hidden md:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memes by title, category, or tag..."
            className="w-full bg-neutral-800/80 text-sm px-5 py-2.5 rounded-full border border-transparent focus:border-neutral-600 focus:outline-none transition-all placeholder-neutral-400"
          />
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/upload"
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-red-600/20 active:scale-95"
          >
            + Create
          </Link>
        </div>
      </header>

      {/* Main Pinterest Column Grid */}
      <main className="p-4 sm:p-6 max-w-[1800px] mx-auto">
        {/* Mobile Search Input */}
        <div className="block md:hidden mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memes..."
            className="w-full bg-neutral-800/80 text-sm px-5 py-2.5 rounded-full border border-transparent focus:border-neutral-600 focus:outline-none transition-all placeholder-neutral-400"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMemes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-sm">No memes found matching your search.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {filteredMemes.map((meme) => {
              const src = meme.video_url || meme.videoUrl || "";
              const isMenuOpen = openMenuId === meme.id;

              return (
                <div
                  key={meme.id}
                  onClick={() => setSelectedMeme(meme)}
                  className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800/60 transition-all duration-300 hover:shadow-2xl cursor-pointer"
                >
                  <CardMedia src={src} />

                  {/* Card Hover Actions (Pinterest Overlay - No Save Button) */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-end pointer-events-none group-hover:pointer-events-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white truncate max-w-[140px] drop-shadow-md">
                        {meme.title}
                      </span>

                      <div className="flex items-center space-x-1.5 relative">
                        {/* Share Button */}
                        <button
                          onClick={(e) => copyToClipboard(e, src)}
                          className="w-8 h-8 rounded-full bg-neutral-900/90 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all shadow"
                          title="Share"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684" />
                          </svg>
                        </button>

                        {/* Three Dots Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : meme.id);
                          }}
                          className="w-8 h-8 rounded-full bg-neutral-900/90 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all shadow"
                          title="More options"
                        >
                          •••
                        </button>

                        {/* Context Menu Dropdown */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-10 w-44 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-30 py-1 text-xs"
                          >
                            <button
                              onClick={(e) => copyToClipboard(e, src)}
                              className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-neutral-200"
                            >
                              Copy video link
                            </button>
                            <button
                              onClick={(e) => handleDirectDownload(e, src, meme.title)}
                              className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-neutral-200"
                            >
                              Download video
                            </button>
                            <button
                              onClick={() => setOpenMenuId(null)}
                              className="w-full text-left px-4 py-2 hover:bg-neutral-800 text-red-400 border-t border-neutral-800/80"
                            >
                              Hide pin
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Pinterest Pin Detail View Modal (No Like/Save Buttons) */}
      {selectedMeme && (
        <div
          onClick={() => setSelectedMeme(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-neutral-800 w-full max-w-4xl rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl relative max-h-[90vh]"
          >
            {/* Close / Back Button */}
            <button
              onClick={() => setSelectedMeme(null)}
              className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-neutral-950/80 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all shadow-lg"
            >
              ←
            </button>

            {/* Left Column: Full Video Player */}
            <div className="bg-black flex items-center justify-center relative min-h-[350px] md:min-h-[500px]">
              <video
                src={`${selectedMeme.video_url || selectedMeme.videoUrl}#t=0.001`}
                controls
                autoPlay
                className="w-full h-full object-contain max-h-[80vh]"
              />
            </div>

            {/* Right Column: Title, Tags & Quick Actions */}
            <div className="p-8 flex flex-col justify-between bg-neutral-900 border-l border-neutral-800 overflow-y-auto">
              <div>
                {/* Header Action Bar */}
                <div className="flex items-center justify-end pb-6 border-b border-neutral-800">
                  <div className="flex items-center space-x-3">
                    {/* Share Button */}
                    <button
                      onClick={(e) => copyToClipboard(e, selectedMeme.video_url || selectedMeme.videoUrl || "")}
                      className="w-9 h-9 rounded-full border border-neutral-700 hover:border-neutral-500 flex items-center justify-center text-xs text-neutral-300"
                      title="Share"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Title & Metadata */}
                <div className="py-6">
                  {selectedMeme.category && (
                    <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider bg-red-500/10 px-2.5 py-1 rounded-full">
                      {selectedMeme.category}
                    </span>
                  )}
                  <h1 className="text-xl font-bold mt-3 text-white leading-snug">{selectedMeme.title}</h1>

                  {selectedMeme.tags && selectedMeme.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {selectedMeme.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs text-neutral-400 bg-neutral-800 px-2.5 py-1 rounded-lg">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Download Option in Modal */}
              <div className="pt-4 border-t border-neutral-800 flex justify-end">
                <button
                  onClick={(e) => handleDirectDownload(e, selectedMeme.video_url || selectedMeme.videoUrl || "", selectedMeme.title)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-all flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Media Component with Hover Play Functionality
function CardMedia({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
      className="relative w-full bg-neutral-900 overflow-hidden"
    >
      <video
        ref={videoRef}
        src={`${src}#t=0.001`}
        muted
        loop
        playsInline
        preload="auto"
        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 block"
      />
    </div>
  );
}