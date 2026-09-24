import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { sufyClient } from "@/lib/sufy";

export const maxDuration = 60; // 60 seconds max execution time on Vercel

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Check Admin Password
    const password = formData.get("password");
    if (!password || password !== process.env.UPLOAD_ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid upload password" },
        { status: 401 }
      );
    }

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (500MB max)
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 500MB. Received: ${(file.size / (1024 * 1024)).toFixed(2)}MB` },
        { status: 413 }
      );
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uniqueKey = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const bucketName = process.env.SUFY_BUCKET_NAME || "meme-vault-storage";

      console.log(`Uploading file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);

      await sufyClient.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: uniqueKey,
          Body: buffer,
          ContentType: file.type,
        })
      );

      const publicBaseUrl = process.env.NEXT_PUBLIC_SUFY_PUBLIC_URL || "https://idoxjpn.sufydely.com";
      const publicUrl = `${publicBaseUrl}/${uniqueKey}`;

      console.log(`✅ Upload successful: ${publicUrl}`);

      return NextResponse.json({ publicUrl }, { status: 200 });
    } catch (sufyError: any) {
      console.error("S3/Sufy Upload Error Details:", {
        message: sufyError.message,
        code: sufyError.code,
        statusCode: sufyError.$metadata?.httpStatusCode,
      });

      if (sufyError.$metadata?.httpStatusCode === 413) {
        return NextResponse.json(
          { 
            error: "File too large for storage provider. Try a smaller video (under 500MB).",
            details: sufyError.message
          },
          { status: 413 }
        );
      }

      return NextResponse.json(
        { 
          error: "Failed to upload file to storage provider",
          details: sufyError.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Server Upload Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process upload request",
        details: error.message || "Unknown error" 
      },
      { status: 500 }
    );
  }
}