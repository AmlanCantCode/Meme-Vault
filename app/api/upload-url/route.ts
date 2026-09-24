import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sufyClient } from "@/lib/sufy";

export async function POST(request: Request) {
  try {
    const { fileName, fileType, password } = await request.json();

    // Check Admin Password
    if (!password || password !== process.env.UPLOAD_ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid upload password" },
        { status: 401 }
      );
    }

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "Missing file details" }, { status: 400 });
    }

    const bucketName = process.env.SUFY_BUCKET_NAME || "meme-vault-storage";
    const uniqueKey = `${Date.now()}-${fileName.replace(/\s+/g, "-")}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      ContentType: fileType,
    });

    // Generate signed upload URL pointing to Sufy / S3
    const uploadUrl = await getSignedUrl(sufyClient, command, { expiresIn: 600 });
    
    // Construct public viewable link using Sufy CDN
    const cdnBase = process.env.NEXT_PUBLIC_SUFY_PUBLIC_URL || "https://idoxjpn.sufydely.com";
    const publicUrl = `${cdnBase}/${uniqueKey}`;

    return NextResponse.json({ uploadUrl, publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error("Presigned URL Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate upload URL" }, { status: 500 });
  }
}