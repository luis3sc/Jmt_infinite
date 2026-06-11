import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environmental variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const endpoint = process.env.CLOUDFLARE_ENDPOINT?.trim();
const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim();
const bucketName = process.env.CLOUDFLARE_BUCKET_NAME?.trim();

if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error('❌ Missing R2 environment variables in .env.local');
  process.exit(1);
}

console.log(`Setting CORS on R2 bucket: ${bucketName}...`);

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function run() {
  try {
    const corsParams = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['http://localhost:3000', 'https://localhost:3000'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    };

    const command = new PutBucketCorsCommand(corsParams);
    await s3.send(command);

    console.log('✅ CORS configuration successfully updated on R2!');
  } catch (error) {
    console.error('❌ Failed to update CORS configuration on R2:', error);
    process.exit(1);
  }
}

run();
