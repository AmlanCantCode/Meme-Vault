export interface Meme {
  id: string;
  title: string;
  slug: string;
  videoUrl: string;
  thumbnailUrl: string;
  tags: string[];
  category: string;
}

export const MOCK_MEMES: Meme[] = [
  {
    id: "1",
    title: "Pedro Pascal Eating Sandwich Green Screen",
    slug: "pedro-pascal-eating-sandwich-green-screen",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    tags: ["pedro pascal", "eating", "green screen", "reaction"],
    category: "Green Screen",
  },
  {
    id: "2",
    title: "Cat Jamming Head Loop",
    slug: "cat-jamming-head-loop",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
    tags: ["cat", "dance", "loop", "vibing"],
    category: "Animal Memes",
  },
  {
    id: "3",
    title: "Dramatic Shocked Reaction Clip",
    slug: "dramatic-shocked-reaction-clip",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    tags: ["shocked", "reaction", "dramatic"],
    category: "Reactions",
  },
];