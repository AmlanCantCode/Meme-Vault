"use client";

import { useState, FormEvent, ChangeEvent, DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Handle local file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setVideoUrl(""); // Clear manual URL if file chosen
    }
  };

  // Handle drag and drop
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setVideoUrl("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoFile && !videoUrl) {
      setError("Please select a video file or enter a video URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let res: Response;

      // Send as FormData if a local file is uploaded
      if (videoFile) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("category", category);
        formData.append("tags", tags);
        formData.append("file", videoFile);

        res = await fetch("/api/memes", {
          method: "POST",
          body: formData,
        });
      } else {
        // Fallback to JSON payload if URL is used
        res = await fetch("/api/memes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            category,
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            video_url: videoUrl,
          }),
        });
      }

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
          
          {/* Title Field */}
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

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Category</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-neutral-800 text-xs px-4 py-3 rounded-xl border border-neutral-700 focus:outline-none focus:border-red-500 text-white cursor-pointer appearance-none"
            >
              <option value="" disabled>Select a category...</option>
              <option value="Brainrot">Brainrot & Hood Irony 💔☠️</option>
              <option value="Programming">Programming & Dev</option>
              <option value="Gaming">Gaming</option>
              <option value="Dark Humor">Dark Humor</option>
              <option value="Anime">Anime</option>
              <option value="General Memes">General Memes</option>
              <option value="Green Screen">Green Screen / Templates</option>
            </select>
          </div>

          {/* Tags Field */}
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

          {/* Local Video File Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Upload Video File (.mp4, .webm)
            </label>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                videoFile
                  ? "border-red-500/80 bg-red-950/20"
                  : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-500 hover:bg-neutral-800"
              }`}
            >
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="w-full flex flex-col items-center space-y-2">
                  <video
                    src={previewUrl}
                    controls
                    className="max-h-44 rounded-xl border border-neutral-700 shadow"
                  />
                  <p className="text-xs text-neutral-300 font-mono truncate max-w-xs">
                    {videoFile?.name} ({(videoFile!.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                  <span className="text-[11px] text-red-400 underline">
                    Click or drag to replace video
                  </span>
                </div>
              ) : (
                <div className="text-center py-3 space-y-1">
                  <svg className="w-8 h-8 mx-auto text-neutral-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs font-medium text-neutral-200">
                    Click to choose or drag video file from PC
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    MP4 or WebM (1–3 MB recommended)
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Optional Direct Video URL Fallback */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">
              Or paste direct Video URL (.mp4)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                if (e.target.value) {
                  setVideoFile(null);
                  setPreviewUrl(null);
                }
              }}
              placeholder="https://example.com/video.mp4"
              className="w-full bg-neutral-800 text-xs px-4 py-2.5 rounded-xl border border-neutral-700/70 focus:outline-none focus:border-red-500 text-white placeholder-neutral-500"
            />
          </div>

          {/* Submit Button */}
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