import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

export const sufyClient = new S3Client({
  region: process.env.SUFY_REGION || "ap-southeast-2",
  endpoint: process.env.SUFY_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUFY_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.SUFY_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: false,
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false, // Prevents SSL certificate validation crashes with custom S3 providers
    }),
  }),
});