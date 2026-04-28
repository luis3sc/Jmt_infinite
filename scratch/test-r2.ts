import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testR2() {
  console.log('Testing R2 connection...');
  console.log('Endpoint:', process.env.CLOUDFLARE_ENDPOINT);
  console.log('Access Key ID:', process.env.CLOUDFLARE_ACCESS_KEY_ID);
  console.log('Bucket:', process.env.CLOUDFLARE_BUCKET_NAME);

  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || '',
    },
  });

  try {
    const data = await client.send(new ListBucketsCommand({}));
    console.log('Success! Buckets found:', data.Buckets?.map(b => b.Name));
  } catch (err: any) {
    console.error('Error connecting to R2:');
    console.error('Message:', err.message);
    console.error('Code:', err.Code || err.name);
    console.error('Status Code:', err.$metadata?.httpStatusCode);
  }
}

testR2();
