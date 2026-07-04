import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root .env.local
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const s3 = new S3Client({
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
  region: "auto",
});

async function main() {
  const codePath = path.join(__dirname, "dist", "index.js");
  const code = fs.readFileSync(codePath);

  console.log("Uploading compiled worker script to R2...");
  await s3.send(new PutObjectCommand({
    Bucket: "vidiooh-media",
    Key: "temp-worker.js",
    Body: code,
    ContentType: "application/javascript",
  }));
  console.log("Upload complete!");
}

main().catch(err => {
  console.error("Upload failed:", err);
  process.exit(1);
});
