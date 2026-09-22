"use client";

import { useEffect, useState, useRef, useCallback, MouseEvent, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

interface Meme {
  id: string;
  title: string;
  category: string;
  tags: string[];
  video_url?: string;
  videoUrl?: string;
}

// ---------- Small utility hook: debounce a value ----------
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function Home() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebouncedValue(searchInput, 300);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Admin delete state
  const [deleteTarget, setDeleteTarget] = useState<Meme | null>(null);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("meme_vault_theme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("meme_vault_theme", newTheme);
  };

  const fetchMemes = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/memes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load memes");
      setMemes(data.memes || []);
    } catch (err: any) {
      console.error("Failed to load memes", err);
      setLoadError(err.message || "Something went wrong loading the vault.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemes();
  }, [fetchMemes]);

  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Escape key closes modals
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedMeme(null);
        setIsSettingsOpen(false);
        if (!deleteLoading) setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [deleteLoading]);

  const filteredMemes = useMemo(() => {
    if (!searchQuery.trim()) return memes;
    const query = searchQuery.toLowerCase();
    return memes.filter((meme) => {
      const matchesTitle = meme.title?.toLowerCase().includes(query);
      const matchesCategory = meme.category?.toLowerCase().includes(query);
      const matchesTags = meme.tags?.some((tag) => tag.toLowerCase().includes(query));
      return matchesTitle || matchesCategory || matchesTags;
    });
  }, [memes, searchQuery]);

  const handleDirectDownload = async (e: MouseEvent, videoUrl: string, title: string) => {
    e.stopPropagation();
    setOpenMenuId(null);
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error("Network response was not ok");
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
    setOpenMenuId(null);
  };

  const requestDelete = (e: MouseEvent, meme: Meme) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setSelectedMeme(null);
    setDeleteError("");
    setPasscodeInput("");
    setDeleteTarget(meme);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteTarget.id,
          videoUrl: deleteTarget.video_url || deleteTarget.videoUrl,
          passcode: passcodeInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete.");
      setMemes((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? "bg-neutral-950 text-white selection:bg-red-600 selection:text-white"
          : "bg-neutral-100 text-neutral-900 selection:bg-red-500 selection:text-white"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md px-6 py-3 flex items-center justify-between border-b transition-colors duration-300 ${
          isDark ? "bg-neutral-950/90 border-neutral-800/60" : "bg-white/90 border-neutral-200"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <Image
              src="/Meme Vault.png"
              alt="Meme Vault Logo"
              width={44}
              height={44}
              className="rounded-xl object-contain"
              priority
            />
          </div>
          <span className="font-extrabold text-lg tracking-tight">Meme Vault</span>
        </div>

        <div className="flex-1 max-w-2xl mx-8 hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search memes by title, category, or tag..."
              className={`w-full text-sm px-5 py-2.5 rounded-full border transition-all focus:outline-none ${
                isDark
                  ? "bg-neutral-800/80 text-white border-transparent focus:border-neutral-600 placeholder-neutral-400"
                  : "bg-neutral-200/70 text-neutral-900 border-transparent focus:border-neutral-300 placeholder-neutral-500"
              }`}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/upload"
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-red-600/20 active:scale-95"
          >
            + Create
          </Link>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isDark
                ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                : "bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
            }`}
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Grid */}
      <main className="p-4 sm:p-6 max-w-[1800px] mx-auto">
        <div className="block md:hidden mb-4 relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search memes..."
            className={`w-full text-sm px-5 py-2.5 rounded-full border transition-all focus:outline-none ${
              isDark
                ? "bg-neutral-800/80 text-white placeholder-neutral-400"
                : "bg-neutral-200/80 text-neutral-900 placeholder-neutral-500 border-neutral-300"
            }`}
          />
        </div>

        {loading ? (
          <SkeletonGrid isDark={isDark} />
        ) : loadError ? (
          <div className="text-center py-24">
            <p className={`text-sm mb-4 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              {loadError}
            </p>
            <button
              onClick={fetchMemes}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all"
            >
              Try again
            </button>
          </div>
        ) : filteredMemes.length === 0 ? (
          <div className="text-center py-24">
            <p className={isDark ? "text-neutral-500 text-sm" : "text-neutral-400 text-sm"}>
              {memes.length === 0
                ? "No memes uploaded yet. Be the first to add one!"
                : "No memes found matching your search."}
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {filteredMemes.map((meme, index) => {
              const src = meme.video_url || meme.videoUrl || "";
              const isMenuOpen = openMenuId === meme.id;

              return (
                <div key={meme.id} className="mb-4 break-inside-avoid">
                  <div
                    onClick={() => setSelectedMeme(meme)}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-2xl cursor-pointer ${
                      isDark
                        ? "bg-neutral-900 border-neutral-800/60"
                        : "bg-white border-neutral-200 shadow-sm"
                    }`}
                  >
                    <LazyCardMedia src={src} isDark={isDark} />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-end pointer-events-none group-hover:pointer-events-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white truncate max-w-[140px] drop-shadow-md">
                          {meme.title}
                        </span>

                        <div className="flex items-center space-x-1.5 relative">
                          <button
                            onClick={(e) => copyToClipboard(e, src)}
                            className="w-8 h-8 rounded-full bg-neutral-900/90 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all shadow"
                            title="Copy link"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684"
                              />
                            </svg>
                          </button>

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

                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute right-0 bottom-10 w-44 rounded-xl shadow-2xl z-30 py-1 text-xs border ${
                                isDark
                                  ? "bg-neutral-900 border-neutral-800 text-neutral-200"
                                  : "bg-white border-neutral-200 text-neutral-800"
                              }`}
                            >
                              <button
                                onClick={(e) => copyToClipboard(e, src)}
                                className={`w-full text-left px-4 py-2 ${
                                  isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
                                }`}
                              >
                                Copy video link
                              </button>
                              <button
                                onClick={(e) => handleDirectDownload(e, src, meme.title)}
                                className={`w-full text-left px-4 py-2 ${
                                  isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
                                }`}
                              >
                                Download video
                              </button>
                              <button
                                onClick={(e) => requestDelete(e, meme)}
                                className={`w-full text-left px-4 py-2 text-red-500 ${
                                  isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
                                }`}
                              >
                                Delete meme
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ad slot reserved every 12 cards — wire up AdSense here later */}
                  {(index + 1) % 12 === 0 && <AdSlot isDark={isDark} />}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div
          onClick={() => setIsSettingsOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all ${
              isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-neutral-200 text-neutral-900"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800/40">
              <h2 className="text-lg font-bold">Settings</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isDark ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300"
                }`}
              >
                ✕
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-xs uppercase font-semibold text-neutral-400 tracking-wider mb-3">
                Appearance
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    isDark
                      ? "bg-neutral-800 border-red-600 text-white shadow-lg ring-1 ring-red-600"
                      : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  <span className="text-xs font-bold">Dark Mode</span>
                </button>

                <button
                  onClick={() => handleThemeChange("light")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    !isDark
                      ? "bg-white border-red-600 text-neutral-900 shadow-lg ring-1 ring-red-600"
                      : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700"
                  }`}
                >
                  <span className="text-xs font-bold">Light Mode</span>
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-full transition-all w-full"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMeme && (
        <div
          onClick={() => setSelectedMeme(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-4xl rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl relative max-h-[90vh] border ${
              isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-neutral-200 text-neutral-900"
            }`}
          >
            <button
              onClick={() => setSelectedMeme(null)}
              className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-neutral-950/80 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all shadow-lg"
            >
              ←
            </button>

            <div className="bg-black flex items-center justify-center relative min-h-[350px] md:min-h-[500px]">
              <video
                key={selectedMeme.id}
                src={`${selectedMeme.video_url || selectedMeme.videoUrl}#t=0.001`}
                controls
                autoPlay
                className="w-full h-full object-contain max-h-[80vh]"
              />
            </div>

            <div
              className={`p-8 flex flex-col justify-between border-l overflow-y-auto ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
              }`}
            >
              <div>
                <div className="py-6">
                  {selectedMeme.category && (
                    <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider bg-red-500/10 px-2.5 py-1 rounded-full">
                      {selectedMeme.category}
                    </span>
                  )}
                  <h1 className="text-xl font-bold mt-3 leading-snug">{selectedMeme.title}</h1>

                  {selectedMeme.tags && selectedMeme.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {selectedMeme.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2.5 py-1 rounded-lg ${
                            isDark ? "text-neutral-400 bg-neutral-800" : "text-neutral-600 bg-neutral-100"
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`pt-4 border-t flex justify-end gap-2 ${
                  isDark ? "border-neutral-800" : "border-neutral-200"
                }`}
              >
                <button
                  onClick={(e) => requestDelete(e, selectedMeme)}
                  className="text-xs font-semibold px-4 py-2.5 rounded-full transition-all bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-600/30"
                >
                  Delete
                </button>
                <button
                  onClick={(e) =>
                    handleDirectDownload(
                      e,
                      selectedMeme.video_url || selectedMeme.videoUrl || "",
                      selectedMeme.title
                    )
                  }
                  className={`text-xs font-semibold px-4 py-2.5 rounded-full transition-all flex items-center space-x-2 ${
                    isDark ? "bg-neutral-800 hover:bg-neutral-700 text-white" : "bg-neutral-200 hover:bg-neutral-300 text-neutral-900"
                  }`}
                >
                  <span>Download Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete Passcode Modal */}
      {deleteTarget && (
        <div
          onClick={() => !deleteLoading && setDeleteTarget(null)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${
              isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-neutral-200 text-neutral-900"
            }`}
          >
            <h2 className="text-lg font-bold mb-1">Delete this meme?</h2>
            <p className="text-xs text-neutral-500 mb-4 truncate">{deleteTarget.title}</p>

            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Admin passcode
            </label>
            <input
              type="password"
              autoFocus
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmDelete()}
              placeholder="Enter admin key"
              className={`w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:border-red-500 ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-100 border-neutral-300 text-neutral-900"
              }`}
            />

            {deleteError && <p className="text-xs text-red-500 mt-2">{deleteError}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className={`flex-1 text-xs font-bold py-2.5 rounded-full ${
                  isDark ? "bg-neutral-800 hover:bg-neutral-700" : "bg-neutral-200 hover:bg-neutral-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading || !passcodeInput}
                className="flex-1 text-xs font-bold py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Lazy-loaded card video: only mounts <video> when scrolled near viewport ----------
function LazyCardMedia({ src, isDark }: { src: string; isDark: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "300px" } // start loading a bit before it's on screen
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
      className={`relative w-full min-h-[180px] overflow-hidden ${isDark ? "bg-neutral-900" : "bg-neutral-100"}`}
    >
      {!isVisible && (
        <div className={`w-full h-[220px] animate-pulse ${isDark ? "bg-neutral-800" : "bg-neutral-200"}`} />
      )}

      {isVisible && !hasError && (
        <video
          ref={videoRef}
          src={`${src}#t=0.001`}
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setHasError(true)}
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 block"
        />
      )}

      {isVisible && hasError && (
        <div
          className={`w-full h-[180px] flex items-center justify-center text-xs ${
            isDark ? "bg-neutral-800 text-neutral-500" : "bg-neutral-200 text-neutral-400"
          }`}
        >
          Video unavailable
        </div>
      )}
    </div>
  );
}

// ---------- Skeleton loading grid (Pinterest-style shimmer) ----------
function SkeletonGrid({ isDark }: { isDark: boolean }) {
  const heights = [220, 280, 180, 240, 320, 200, 260, 300, 190, 250];
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
      {heights.concat(heights).map((h, i) => (
        <div
          key={i}
          style={{ height: h }}
          className={`mb-4 break-inside-avoid rounded-2xl animate-pulse ${
            isDark ? "bg-neutral-900" : "bg-neutral-200"
          }`}
        />
      ))}
    </div>
  );
}

// ---------- Ad slot placeholder — reserved space so layout won't shift once ads go live ----------
function AdSlot({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`mt-4 rounded-2xl border-2 border-dashed flex items-center justify-center h-40 text-[11px] ${
        isDark
          ? "border-neutral-800 bg-neutral-900/40 text-neutral-600"
          : "border-neutral-300 bg-neutral-50 text-neutral-400"
      }`}
    >
      Ad space reserved
    </div>
  );
}