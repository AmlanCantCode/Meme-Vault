import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { sufyClient } from "@/lib/sufy";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const passcode = formData.get("passcode") as string;
    const file = formData.get("file") as File;

    if (!passcode || passcode !== process.env.UPLOAD_ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Oops! Wrong Password." },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileKey = `${timestamp}_${cleanFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: process.env.SUFY_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type || "video/mp4",
    });

    await sufyClient.send(command);

    const publicBaseUrl = process.env.NEXT_PUBLIC_SUFY_PUBLIC_URL || "";
    const videoUrl = `${publicBaseUrl}/${fileKey}`;

    return NextResponse.json({
      success: true,
      videoUrl,
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload file." },
      { status: 500 }
    );
  }
}