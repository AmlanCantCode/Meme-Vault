import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: memes, error } = await supabase
      .from("memes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ memes: memes || [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title = "", category = "", tags = [], video_url = "", url = "", slug = "" } = body;

    const finalVideoUrl = video_url || url;

    if (!title.trim()) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    if (!finalVideoUrl) {
      return NextResponse.json(
        { error: "Video URL is required." },
        { status: 400 }
      );
    }

    // Format tags if passed as comma-separated string
    let formattedTags = tags;
    if (typeof tags === "string") {
      formattedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    // Generate slug fallback if missing
    const finalSlug =
      slug ||
      title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") +
        "-" +
        Date.now();

    // Duplicate title check using admin client
    const { data: existing, error: dupCheckError } = await supabaseAdmin
      .from("memes")
      .select("id")
      .ilike("title", title.trim())
      .limit(1);

    if (dupCheckError) {
      console.error("Duplicate check failed:", dupCheckError);
    } else if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error:
            "A meme with this exact title already exists. Please rename it or check the vault.",
        },
        { status: 409 }
      );
    }

    // Insert record via admin client
    const { data: newMeme, error } = await supabaseAdmin
      .from("memes")
      .insert([
        {
          title: title.trim(),
          category,
          tags: formattedTags,
          video_url: finalVideoUrl,
          slug: finalSlug,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, meme: newMeme }, { status: 201 });
  } catch (error: any) {
    console.error("Memes POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}