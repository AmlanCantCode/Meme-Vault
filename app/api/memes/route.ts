import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET Handler: Fetch all memes for the Pinterest grid
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("memes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase GET Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memes: data || [] }, { status: 200 });
  } catch (error: any) {
    console.error("Memes GET Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch memes." },
      { status: 500 }
    );
  }
}

// POST Handler: Save meme metadata during upload
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, tagsRaw, videoUrl } = body;

    if (!title || !videoUrl) {
      return NextResponse.json(
        { error: "Title and Video URL are required." },
        { status: 400 }
      );
    }

    // Process tags array
    const tags = tagsRaw
      ? tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const { data, error } = await supabase
      .from("memes")
      .insert([
        {
          title,
          category,
          tags,
          video_url: videoUrl,
        },
      ])
      .select();

    if (error) {
      console.error("Supabase POST Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, meme: data[0] }, { status: 200 });
  } catch (error: any) {
    console.error("Memes POST Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save meme metadata." },
      { status: 500 }
    );
  }
}