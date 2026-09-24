import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://meme-vault-kappa.vercel.app";

  try {
    const res = await fetch(`${baseUrl}/api/memes`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch memes");

    const data = await res.json();
    const memes = data.memes || [];

    const memeUrls = memes.map((meme: { id: string }) => ({
      url: `${baseUrl}/meme/${meme.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1.0,
      },
      ...memeUrls,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
      },
    ];
  }
}