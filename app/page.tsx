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

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong loading the vault.";
      console.error("Failed to load memes", err);
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemes();
  }, [fetchMemes]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenuId(null);
      setIsSettingsOpen(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

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

  const handleDirectDownload = async (e: MouseEvent<HTMLButtonElement>, videoUrl: string, title: string) => {
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
      console.error("Direct download failed, opening direct link", err);
      window.open(videoUrl, "_blank");
    }
  };

  const copyToClipboard = (e: MouseEvent<HTMLButtonElement>, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setOpenMenuId(null);
  };

  const requestDelete = (e: MouseEvent<HTMLButtonElement>, meme: Meme) => {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Deletion failed.";
      setDeleteError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${
        isDark
          ? "bg-[#121212] text-neutral-100 selection:bg-red-600 selection:text-white"
          : "bg-neutral-50 text-neutral-900 selection:bg-red-500 selection:text-white"
      }`}
    >
      {/* Floating Top Navigation */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md px-3 sm:px-6 py-3 border-b transition-colors ${
          isDark ? "bg-[#121212]/90 border-neutral-800/60" : "bg-white/90 border-neutral-200/60"
        }`}
      >
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
              <Image
                src="/Meme Vault.png"
                alt="Meme Vault"
                fill
                className="object-cover"
                priority
              />
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-4xl">
            <div className="relative flex items-center">
              <svg
                className="w-4 h-4 absolute left-4 text-neutral-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for memes, categories, or tags..."
                className={`w-full text-xs sm:text-sm pl-11 pr-10 py-2.5 rounded-full transition-all focus:outline-none ${
                  isDark
                    ? "bg-[#212121] text-neutral-100 placeholder-neutral-400 focus:bg-[#2a2a2a]"
                    : "bg-neutral-100 text-neutral-900 placeholder-neutral-500 focus:bg-neutral-200/80"
                }`}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3.5 text-neutral-400 hover:text-neutral-200 text-xs w-5 h-5 flex items-center justify-center rounded-full"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/upload"
              className="text-xs font-bold px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="text-sm font-normal">+</span>
              <span>Create</span>
            </Link>

            {/* Settings Toggle */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsOpen(!isSettingsOpen);
                }}
                className={`p-2.5 rounded-full transition-colors ${
                  isDark ? "hover:bg-neutral-800 text-neutral-300" : "hover:bg-neutral-100 text-neutral-700"
                }`}
                aria-label="Settings"
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

              {isSettingsOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute right-0 top-full mt-2 w-44 rounded-2xl shadow-xl border p-2 z-50 transition-all ${
                    isDark ? "bg-[#1f1f1f] border-neutral-800" : "bg-white border-neutral-200"
                  }`}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                    Appearance
                  </p>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <button
                      onClick={() => {
                        handleThemeChange("dark");
                        setIsSettingsOpen(false);
                      }}
                      className={`text-xs py-1.5 rounded-xl font-semibold transition-all ${
                        theme === "dark"
                          ? "bg-red-600 text-white"
                          : isDark
                          ? "bg-neutral-800 text-neutral-400 hover:text-white"
                          : "bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => {
                        handleThemeChange("light");
                        setIsSettingsOpen(false);
                      }}
                      className={`text-xs py-1.5 rounded-xl font-semibold transition-all ${
                        theme === "light"
                          ? "bg-red-600 text-white"
                          : isDark
                          ? "bg-neutral-800 text-neutral-400 hover:text-white"
                          : "bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      Light
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Feed */}
      <main className="px-2 sm:px-4 md:px-6 py-4 max-w-[1920px] mx-auto w-full">
        {loadError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{loadError}</span>
          </div>
        )}

        {loading ? (
          <SkeletonGrid isDark={isDark} />
        ) : filteredMemes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <h3 className="text-base font-bold mb-1">No memes found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mb-5">
              {searchInput ? "No results match your search filter." : "Your vault is currently empty."}
            </p>
            <Link
              href="/upload"
              className="text-xs font-bold px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all shadow-md"
            >
              Upload First Meme
            </Link>
          </div>
        ) : (
          <div className="columns-2 xs:columns-3 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 2xl:columns-7 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
            {filteredMemes.map((meme) => (
              <div
                key={meme.id}
                className="break-inside-avoid group relative flex flex-col cursor-pointer"
                onClick={() => setSelectedMeme(meme)}
              >
                <div className="relative rounded-2xl overflow-hidden bg-neutral-900 shadow-sm group-hover:shadow-md transition-all duration-200">
                  <LazyCardMedia src={meme.video_url || meme.videoUrl || ""} isDark={isDark} />

                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none p-2.5 flex flex-col justify-between">
                    <div className="flex justify-end pointer-events-auto">
                      <button
                        onClick={(e) =>
                          handleDirectDownload(e, meme.video_url || meme.videoUrl || "", meme.title)
                        }
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-full shadow-md transition-transform active:scale-95"
                      >
                        Save
                      </button>
                    </div>

                    <div className="flex justify-between items-center pointer-events-auto">
                      {meme.category ? (
                        <span className="text-[9px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {meme.category}
                        </span>
                      ) : (
                        <div />
                      )}

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === meme.id ? null : meme.id);
                          }}
                          className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-neutral-900 flex items-center justify-center shadow-md transition-all"
                          aria-label="Options"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                        </button>

                        {openMenuId === meme.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute right-0 bottom-full mb-1.5 w-36 rounded-2xl shadow-2xl border backdrop-blur-md z-50 overflow-hidden ${
                              isDark ? "bg-[#1f1f1f]/95 border-neutral-800 text-neutral-100" : "bg-white/95 border-neutral-200 text-neutral-900"
                            }`}
                          >
                            <button
                              onClick={(e) =>
                                handleDirectDownload(e, meme.video_url || meme.videoUrl || "", meme.title)
                              }
                              className={`w-full text-left text-xs px-3 py-2 flex items-center gap-2 transition-colors ${
                                isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
                              }`}
                            >
                              <span>📥</span>
                              <span>Download</span>
                            </button>
                            <button
                              onClick={(e) => copyToClipboard(e, meme.video_url || meme.videoUrl || "")}
                              className={`w-full text-left text-xs px-3 py-2 flex items-center gap-2 transition-colors ${
                                isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
                              }`}
                            >
                              <span>🔗</span>
                              <span>Copy Link</span>
                            </button>
                            <button
                              onClick={(e) => requestDelete(e, meme)}
                              className="w-full text-left text-xs px-3 py-2 flex items-center gap-2 text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 px-0.5">
                  <h3 className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2">
                    {meme.title}
                  </h3>
                  {meme.tags && meme.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {meme.tags.slice(0, 2).map((t, idx) => (
                        <span key={idx} className="text-[9px] text-neutral-500">
                          #{t.replace(/^#+/, "")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedMeme && (
        <div
          onClick={() => setSelectedMeme(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh] ${
              isDark ? "bg-[#181818] text-neutral-100" : "bg-white text-neutral-900"
            }`}
          >
            <div className="relative bg-black flex-1 min-h-[260px] md:min-h-[400px] flex items-center justify-center">
              <video
                src={selectedMeme.video_url || selectedMeme.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full max-h-[65vh] object-contain"
              />
            </div>

            <div className="w-full md:w-72 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  {selectedMeme.category && (
                    <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider bg-red-500/10 px-2.5 py-0.5 rounded-full">
                      {selectedMeme.category}
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedMeme(null)}
                    className="text-neutral-400 hover:text-white p-1 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <h1 className="text-sm sm:text-base font-bold leading-snug mb-2">
                  {selectedMeme.title}
                </h1>

                {selectedMeme.tags && selectedMeme.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedMeme.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          isDark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        #{tag.replace(/^#+/, "")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 mt-4 border-t border-neutral-800/40">
                <button
                  onClick={(e) =>
                    handleDirectDownload(
                      e,
                      selectedMeme.video_url || selectedMeme.videoUrl || "",
                      selectedMeme.title
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
                >
                  Download
                </button>
                <button
                  onClick={(e) => requestDelete(e, selectedMeme)}
                  className="w-full py-2 px-4 rounded-full font-semibold text-xs text-red-500 hover:bg-red-500/10 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Deletion Modal */}
      {deleteTarget && (
        <div
          onClick={() => !deleteLoading && setDeleteTarget(null)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl ${
              isDark ? "bg-[#1f1f1f] text-neutral-100" : "bg-white text-neutral-900"
            }`}
          >
            <h2 className="text-sm font-bold mb-1">Confirm Deletion</h2>
            <p className="text-xs text-neutral-500 mb-4 truncate">{deleteTarget.title}</p>

            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Admin Passcode
            </label>
            <input
              type="password"
              autoFocus
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmDelete()}
              placeholder="Enter passcode"
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-red-500 ${
                isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-100 border-neutral-300 text-neutral-900"
              }`}
            />

            {deleteError && <p className="text-xs text-red-500 mt-2 font-medium">{deleteError}</p>}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className={`flex-1 text-xs font-bold py-2 rounded-full transition-colors ${
                  isDark ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300" : "bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading || !passcodeInput}
                className="flex-1 text-xs font-bold py-2 rounded-full bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-all"
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
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full overflow-hidden ${
        isDark ? "bg-neutral-900" : "bg-neutral-200"
      }`}
    >
      {!isVisible && (
        <div className={`w-full aspect-[3/4] animate-pulse ${isDark ? "bg-neutral-800" : "bg-neutral-200"}`} />
      )}

      {isVisible && !hasError && (
        <video
          ref={videoRef}
          src={`${src}#t=0.001`}
          muted
          loop
          playsInline
          controls={false}
          preload="metadata"
          onError={() => setHasError(true)}
          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300 block"
        />
      )}

      {isVisible && hasError && (
        <div className="w-full aspect-[3/4] flex flex-col items-center justify-center text-[10px] text-neutral-500 p-2 text-center">
          <span>⚠️</span>
          <span>Unavailable</span>
        </div>
      )}
    </div>
  );
}

function SkeletonGrid({ isDark }: { isDark: boolean }) {
  const heights = [180, 240, 160, 220, 200, 250, 190, 210, 170, 230, 190, 220];
  return (
    <div className="columns-2 xs:columns-3 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 2xl:columns-7 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
      {heights.map((h, i) => (
        <div
          key={i}
          style={{ height: h }}
          className={`break-inside-avoid rounded-2xl animate-pulse ${
            isDark ? "bg-neutral-800/60" : "bg-neutral-200"
          }`}
        />
      ))}
    </div>
  );
}