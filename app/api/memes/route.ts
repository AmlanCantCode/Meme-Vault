import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const formData = await req.formData();
    const title = (formData.get("title") as string) || "";
    const category = (formData.get("category") as string) || "";
    const rawTags = (formData.get("tags") as string) || "";
    const tags = rawTags.split(",").map((t) => t.trim()).filter(Boolean);
    const file = formData.get("file") as File | null;
    let video_url = (formData.get("video_url") as string) || "";

    if (!title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    // 🔁 Duplicate check: reject if a meme with the same title (case-insensitive) already exists
    const { data: existing, error: dupCheckError } = await supabase
      .from("memes")
      .select("id")
      .ilike("title", title.trim())
      .limit(1);

    if (dupCheckError) {
      console.error("Duplicate check failed:", dupCheckError);
    } else if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "A meme with this exact title already exists. Please rename it or check the vault." },
        { status: 409 }
      );
    }

    // If a local file is uploaded, push it to SUFY
    if (file && file.size > 0) {
      const sufyFormData = new FormData();
      sufyFormData.append("file", file);

      const sufyRes = await fetch("https://api.sufy.io/v1/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SUFY_API_KEY}`
        },
        body: sufyFormData,
      });

      if (!sufyRes.ok) {
        const errText = await sufyRes.text();
        throw new Error(`SUFY Upload Failed: ${errText}`);
      }

      const sufyData = await sufyRes.json();
      video_url = sufyData.url;
    }

    if (!video_url) {
      return NextResponse.json({ error: "Video URL or File is required" }, { status: 400 });
    }

    const { data: newMeme, error } = await supabase
      .from("memes")
      .insert([
        { title: title.trim(), category, tags, video_url }
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