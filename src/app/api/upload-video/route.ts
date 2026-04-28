import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createRequire } from 'module'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

// Use require to bypass Turbopack static analysis of dynamic binary paths
const require = createRequire(import.meta.url)
const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const ffprobeInstaller = require('@ffprobe-installer/ffprobe')

// Set both ffmpeg AND ffprobe binary paths explicitly
ffmpeg.setFfmpegPath(ffmpegInstaller.path)
ffmpeg.setFfprobePath(ffprobeInstaller.path)

// Cloudflare R2 client (S3-compatible)
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_ENDPOINT?.trim(),
  forcePathStyle: true, // Required for many R2 configurations
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim() || '',
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim() || '',
  },
})

const BUCKET = process.env.CLOUDFLARE_BUCKET_NAME?.trim() || ''

console.log(`[upload-video] R2 Client initialized. Bucket: ${BUCKET}, Endpoint: ${process.env.CLOUDFLARE_ENDPOINT?.trim()}`)
console.log(`[upload-video] Access Key ID starts with: ${process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim().substring(0, 4)}...`)


// R2 public URL base
function buildPublicUrl(key: string): string {
  // Use the public R2 URL defined in .env.local
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim()?.replace(/\/$/, '')
  
  if (publicBase) {
    return `${publicBase}/${key}`
  }

  // Fallback to internal endpoint (less desirable for public access)
  const base = process.env.CLOUDFLARE_ENDPOINT!.replace(/\/$/, '')
  return `${base}/${BUCKET}/${key}`
}

// Probe video metadata using ffprobe
function probeVideo(filePath: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: { format?: { duration?: number } }) => {
      if (err) {
        reject(err)
      } else {
        resolve({ duration: metadata?.format?.duration ?? 0 })
      }
    })
  })
}

// Expanded accepted MIME types (all common video formats ffmpeg supports)
const ALLOWED_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',      // .mov
  'video/x-msvideo',     // .avi
  'video/webm',
  'video/mpeg',
  'video/x-mpeg',
  'video/x-matroska',    // .mkv
  'video/3gpp',
  'video/3gpp2',
  'video/x-ms-wmv',      // .wmv
  'video/x-flv',         // .flv
  'video/ogg',
  'video/x-m4v',         // .m4v
  'video/MP2T',          // .ts
  'application/octet-stream', // fallback for some browsers that mis-detect MIME
])

export async function POST(req: NextRequest) {
  let tempPath: string | null = null

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const orderId = formData.get('orderId') as string | null

    if (!file || !orderId) {
      return NextResponse.json(
        { error: 'Parámetros incompletos. Se requiere el archivo y el ID del pedido.' },
        { status: 400 }
      )
    }

    // ── MIME type validation ───────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Formato no soportado: "${file.type}". Usa MP4, MOV, AVI, WebM, MKV, MPEG u otro formato de video estándar.` },
        { status: 400 }
      )
    }

    // ── Size validation ────────────────────────────────────────────────────────
    const MAX_BYTES = 50 * 1024 * 1024 // 50 MB
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'El video supera el límite de 50 MB.' },
        { status: 400 }
      )
    }

    // ── Write to temp file preserving the original extension ───────────────────
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4'

    const tmpDir = join(tmpdir(), 'mixooh-uploads')
    await mkdir(tmpDir, { recursive: true })
    // Use real extension so ffprobe can detect the container format
    tempPath = join(tmpDir, `${orderId}-${Date.now()}.${fileExt}`)
    await writeFile(tempPath, buffer)

    console.log(`[upload-video] Temp file written: ${tempPath} (${buffer.byteLength} bytes)`)

    // ── ffprobe: validate duration ─────────────────────────────────────────────
    let duration = 0
    try {
      const meta = await probeVideo(tempPath)
      duration = meta.duration
      console.log(`[upload-video] Duration detected: ${duration}s`)
    } catch (probeErr) {
      console.error('[upload-video] ffprobe error:', probeErr)
      // If ffprobe fails, skip duration check but still allow the upload
      // (some valid videos have metadata issues that don't affect playback)
      console.warn('[upload-video] Skipping duration validation due to probe error. Proceeding with upload.')
    }

    const MAX_DURATION = 300 // 5 minutes — relaxed limit
    if (duration > 0 && duration > MAX_DURATION) {
      return NextResponse.json(
        { error: `El video no puede superar ${MAX_DURATION / 60} minutos. Duración detectada: ${Math.round(duration)}s.` },
        { status: 400 }
      )
    }

    // ── Upload to Cloudflare R2 ────────────────────────────────────────────────
    const key = `campaign-videos/${orderId}-${Date.now()}.${fileExt}`
    console.log(`[upload-video] Uploading to R2: ${key}`)

    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type, 
          ContentLength: buffer.byteLength,
        })
      )
    } catch (s3Err: any) {
      console.error('[upload-video] R2 Upload Error Details:', {
        message: s3Err.message,
        code: s3Err.Code || s3Err.name,
        requestId: s3Err.$metadata?.requestId,
        extendedRequestId: s3Err.$metadata?.extendedRequestId,
        cfId: s3Err.$metadata?.cfId,
      })
      throw s3Err // Rethrow to be caught by the outer catch
    }

    const videoUrl = buildPublicUrl(key)
    console.log(`[upload-video] Uploaded successfully: ${videoUrl}`)

    // ── Update Supabase orders table (using service_role to bypass RLS) ─────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''

    if (!serviceRoleKey || serviceRoleKey === 'PEGAR_AQUI_TU_SERVICE_ROLE_KEY' || !supabaseUrl) {
      const missing = []
      if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
      if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
      if (serviceRoleKey === 'PEGAR_AQUI_TU_SERVICE_ROLE_KEY') missing.push('SUPABASE_SERVICE_ROLE_KEY (placeholder)')
      
      console.error('[upload-video] Configuración incompleta:', { missing })
      return NextResponse.json(
        { error: `Configuración del servidor incompleta. Faltan: ${missing.join(', ')}` },
        { status: 500 }
      )
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    console.log(`[upload-video] Updating order ${orderId} in Supabase...`)
    console.log(`[upload-video] video_url: ${videoUrl}`)

    const { data: updateData, error: dbError } = await supabase
      .from('orders')
      .update({
        status: 'VIDEO_SENT',
        video_url: videoUrl,
      })
      .eq('id', orderId)
      .select()

    if (dbError) {
      console.error('[upload-video] Supabase update error:', JSON.stringify(dbError, null, 2))
      return NextResponse.json(
        { error: `Video subido a Cloudflare pero no se pudo actualizar el pedido: ${dbError.message}` },
        { status: 500 }
      )
    }

    console.log('[upload-video] Supabase update result:', JSON.stringify(updateData, null, 2))
    if (!updateData || updateData.length === 0) {
      console.warn(`[upload-video] WARNING: No rows updated for orderId=${orderId}. Check if the order exists.`)
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      duration: Math.round(duration),
    })

  } catch (err: unknown) {
    console.error('[upload-video] Unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Error interno del servidor.'
    return NextResponse.json({ error: message }, { status: 500 })

  } finally {
    // Always clean up temp file
    if (tempPath) {
      unlink(tempPath).catch(() => {})
    }
  }
}
