import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_ENDPOINT?.trim(),
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim() || '',
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim() || '',
  },
})

const BUCKET = process.env.CLOUDFLARE_BUCKET_NAME?.trim() || ''

async function listMeta() {
  try {
    const response = await r2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: 'campaign-videos/',
      })
    )

    console.log('Processed files in R2:')
    const processed = response.Contents?.filter(c => c.Key?.includes('/processed/')) || []
    processed.forEach(p => {
      console.log(`- Key: ${p.Key} | Size: ${p.Size} | LastModified: ${p.LastModified}`)
    })

    console.log('\nFlat raw files in R2 (no raw/ subdirectory):')
    const flat = response.Contents?.filter(c => !c.Key?.includes('/processed/') && !c.Key?.includes('/raw/')) || []
    flat.forEach(f => {
      console.log(`- Key: ${f.Key} | Size: ${f.Size} | LastModified: ${f.LastModified}`)
    })
  } catch (err) {
    console.error(err)
  }
}

listMeta()
