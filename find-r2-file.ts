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

async function findFile() {
  const target = 'ea996e48'
  try {
    let continuationToken: string | undefined = undefined
    let found = false

    do {
      const response = await r2.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          ContinuationToken: continuationToken,
        })
      )

      const matches = response.Contents?.filter(c => c.Key?.includes(target)) || []
      if (matches.length > 0) {
        console.log(`Found matching keys for ${target}:`)
        matches.forEach(m => console.log(`- ${m.Key} (${m.Size} bytes)`))
        found = true
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    if (!found) {
      console.log(`No keys found in R2 containing "${target}"`)
    }
  } catch (err) {
    console.error(err)
  }
}

findFile()
