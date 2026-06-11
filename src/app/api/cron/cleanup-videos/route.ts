import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

// Cloudflare R2 client (S3-compatible)
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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret') || req.headers.get('authorization')?.replace('Bearer ', '')
    const dryRun = url.searchParams.get('dryRun') === 'true'

    // 1. Validate Secret
    const expectedSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // Set "today" to start of the day in UTC for comparison
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    // 3. Get Active and Ended Bookings
    const { data: activeBookings, error: activeErr } = await supabase
      .from('bookings')
      .select('order_id')
      .gte('end_date', todayStr)

    if (activeErr) throw activeErr

    const { data: endedBookings, error: endedErr } = await supabase
      .from('bookings')
      .select('order_id')
      .lt('end_date', todayStr)

    if (endedErr) throw endedErr

    // Determine unique order_ids
    const activeOrderIds = new Set(activeBookings.map(b => b.order_id))
    const endedOrderIds = new Set(endedBookings.map(b => b.order_id))

    // Orders to clean up: Ended but NOT active anywhere else
    const candidateOrderIds = Array.from(endedOrderIds).filter(id => !activeOrderIds.has(id))

    if (candidateOrderIds.length === 0) {
      return NextResponse.json({ message: 'No orders to clean up', dryRun })
    }

    // 4. Get Orders with video_url
    const { data: ordersToClean, error: ordersErr } = await supabase
      .from('orders')
      .select('id, video_url')
      .in('id', candidateOrderIds)
      .not('video_url', 'is', null)

    if (ordersErr) throw ordersErr

    if (!ordersToClean || ordersToClean.length === 0) {
      return NextResponse.json({ message: 'No videos to delete', candidateOrderIds, dryRun })
    }

    const results = []

    // 5. Delete Videos from R2 and update DB
    for (const order of ordersToClean) {
      const videoUrl = order.video_url
      if (!videoUrl) continue

      // Extraer filename de la URL (ej. https://.../campaign-videos/xyz.mp4 -> xyz.mp4)
      const filename = videoUrl.split('/').pop()
      const key = `campaign-videos/${filename}`

      if (dryRun) {
        results.push({ orderId: order.id, action: 'Would delete', key })
        continue
      }

      try {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
          })
        )

        const { error: updateErr } = await supabase
          .from('orders')
          .update({ video_url: null })
          .eq('id', order.id)

        if (updateErr) throw updateErr

        results.push({ orderId: order.id, action: 'Deleted', key })
      } catch (err: any) {
        console.error(`Error processing order ${order.id}:`, err)
        results.push({ orderId: order.id, error: err.message })
      }
    }

    return NextResponse.json({
      message: dryRun ? 'Dry run completed' : 'Cleanup completed',
      results
    })

  } catch (error: any) {
    console.error('[cron/cleanup-videos] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
