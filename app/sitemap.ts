import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Replace this with your actual site URL or environment variable
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.vercel.app";

  try {
    // Fetch all memes to generate URLs for Google
    const res = await fetch(`${baseUrl}/api/memes`, { cache: "no-store" });
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