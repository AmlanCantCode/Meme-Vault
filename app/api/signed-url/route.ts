import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sufyClient } from "@/lib/sufy";

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, password } = await request.json();

    // 🔒 Verify Admin Password
    if (!password || password !== process.env.UPLOAD_ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Oops! Password is incorrect." },
        { status: 401 }
      );
    }

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing file details" },
        { status: 400 }
      );
    }

    console.log(`Generating presigned URL for: ${fileName} (${fileType})`);

    const bucketName = process.env.SUFY_BUCKET_NAME || "meme-vault-storage";
    const uniqueKey = `${Date.now()}-${fileName.replace(/\s+/g, "-")}`;

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueKey,
        ContentType: fileType,
      });

      console.log("Generating signed URL...");
      const uploadUrl = await getSignedUrl(sufyClient, command, {
        expiresIn: 600, // 10 minutes
      });

      const cdnBase =
        process.env.NEXT_PUBLIC_SUFY_PUBLIC_URL ||
        "https://idoxjpn.sufydely.com";
      const publicUrl = `${cdnBase}/${uniqueKey}`;

      console.log(`✅ Presigned URL generated successfully`);
      console.log(`Upload URL: ${uploadUrl.substring(0, 50)}...`);
      console.log(`Public URL: ${publicUrl}`);

      return NextResponse.json(
        { uploadUrl, publicUrl },
        { status: 200 }
      );
    } catch (sufyError: any) {
      console.error("SUFY/S3 Error:", {
        message: sufyError.message,
        code: sufyError.code,
        statusCode: sufyError.$metadata?.httpStatusCode,
      });

      return NextResponse.json(
        {
          error: "Failed to generate presigned URL",
          details: sufyError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Presigned URL Generation Error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate upload URL",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Presigned URL endpoint",
      method: "POST",
      expected: {
        fileName: "video.mp4",
        fileType: "video/mp4",
      },
    },
    { status: 200 }
  );
}