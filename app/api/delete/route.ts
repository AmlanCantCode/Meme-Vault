import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { sufyClient } from "@/lib/sufy";
import { supabase } from "@/lib/supabase";

export async function DELETE(request: Request) {
  try {
    const { id, videoUrl, passcode } = await request.json();

    // 🔒 1. Verify Secret Passcode
    if (!passcode || passcode !== process.env.UPLOAD_ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Oops! Wrong Password." },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json({ error: "Meme ID is required." }, { status: 400 });
    }

    // 2. Delete video from SUFY S3 Storage
    if (videoUrl) {
      try {
        // Robust S3 key extraction: safe against trailing slashes & URL-encoded characters
        const rawKey = new URL(videoUrl).pathname.replace(/^\//, "");
        const key = decodeURIComponent(rawKey);

        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.SUFY_BUCKET_NAME,
          Key: key,
        });

        await sufyClient.send(deleteCommand);
      } catch (sufyErr) {
        console.error("SUFY Storage Delete Error:", sufyErr);
        return NextResponse.json(
          { error: "Failed to delete video file from storage." },
          { status: 500 }
        );
      }
    }

    // 3. Delete metadata record from Supabase
    const { error } = await supabase.from("memes").delete().eq("id", id);

    if (error) {
      console.error("Supabase Delete Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Route Error:", error);
    return NextResponse.json(
      { error: "Failed to delete meme." },
      { status: 500 }
    );
  }
}