import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

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

export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verify gestor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'gestor' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await request.json()
  const { orderId, action, rejectionReason, evidenceUrls } = body

  if (!orderId || !action || !['APPROVE', 'REJECT', 'MARK_SENT', 'UPLOAD_EVIDENCE'].includes(action)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  let newStatus = ''
  if (action === 'APPROVE') newStatus = 'APPROVED'
  else if (action === 'REJECT') newStatus = 'REJECTED'
  else if (action === 'MARK_SENT') newStatus = 'SENT_TO_PROVIDER'
  else if (action === 'UPLOAD_EVIDENCE') newStatus = 'CONFIRMED'

  const updateFields: any = { status: newStatus }
  if (action === 'REJECT' && rejectionReason) {
    updateFields.rejection_reason = rejectionReason
    updateFields.video_url = null // Delete reference in database

    // Get current order video_url to delete it from Cloudflare R2
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('video_url')
      .eq('id', orderId)
      .single()

    const videoUrl = currentOrder?.video_url
    if (videoUrl) {
      let key = ''
      try {
        const parsedUrl = new URL(videoUrl)
        key = parsedUrl.pathname.replace(/^\//, '')
      } catch (e) {
        const filename = videoUrl.split('/').pop()
        key = `campaign-videos/${filename}`
      }

      try {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
          })
        )
        console.log(`[review-order] Video deleted from Cloudflare R2: ${key}`)
      } catch (err: any) {
        console.error(`[review-order] Error deleting R2 object ${key}:`, err)
      }
    }
  } else if (action === 'APPROVE') {
    updateFields.rejection_reason = null
  } else if (action === 'UPLOAD_EVIDENCE' && evidenceUrls) {
    updateFields.evidence_urls = evidenceUrls
  }

  const { error } = await supabase
    .from('orders')
    .update(updateFields)
    .eq('id', orderId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, newStatus })
}
