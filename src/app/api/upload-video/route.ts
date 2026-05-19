import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createRequire } from 'module'
import { writeFile, unlink, mkdir, readFile } from 'fs/promises'
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
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim() || '',
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim() || '',
  },
})

const BUCKET = process.env.CLOUDFLARE_BUCKET_NAME?.trim() || ''

console.log(`[upload-video] R2 Client initialized. Bucket: ${BUCKET}, Endpoint: ${process.env.CLOUDFLARE_ENDPOINT?.trim()}`)

// R2 public URL base
function buildPublicUrl(key: string): string {
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim()?.replace(/\/$/, '')
  if (publicBase) return `${publicBase}/${key}`
  const base = process.env.CLOUDFLARE_ENDPOINT!.replace(/\/$/, '')
  return `${base}/${BUCKET}/${key}`
}

// Probe video metadata using ffprobe
function probeVideo(filePath: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: { format?: { duration?: number } }) => {
      if (err) reject(err)
      else resolve({ duration: metadata?.format?.duration ?? 0 })
    })
  })
}

/**
 * Convierte una imagen estática (PNG/JPEG) a un video MP4 de duración fija en el servidor.
 * Usa fluent-ffmpeg que ya está instalado como server-external-package.
 */
function imageToVideoServer(
  inputPath: string,
  outputPath: string,
  durationSeconds: number = 7,
  width: number = 1280,
  height: number = 720
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .inputOption('-loop', '1')
      .inputOption('-framerate', '25')
      .outputOptions([
        `-t ${durationSeconds}`,
        `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
        '-c:v libx264',
        '-preset ultrafast',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
      ])
      .on('start', (cmd: string) => console.log('[upload-video] ffmpeg image→video cmd:', cmd))
      .on('error', (err: Error) => {
        console.error('[upload-video] ffmpeg image→video error:', err.message)
        reject(err)
      })
      .on('end', () => resolve())
      .save(outputPath)
  })
}

// Accepted MIME types — ahora incluye imágenes (el servidor las convierte a video)
const ALLOWED_MIME_TYPES = new Set([
  // Imágenes — convertidas a video de 7s en el servidor
  'image/png',
  'image/jpeg',
  'image/jpg',
  // Videos — procesados normalmente
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
  'application/octet-stream', // fallback
])

export async function POST(req: NextRequest) {
  let tempInputPath: string | null = null
  let tempOutputPath: string | null = null

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

    console.log(`[upload-video] Received file: name=${file.name}, type=${file.type}, size=${file.size}`)

    // ── MIME type validation ───────────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Formato no soportado: "${file.type}". Usa imágenes (PNG/JPEG) o videos (MP4, MOV, etc.).` },
        { status: 400 }
      )
    }

    // ── Size validation ────────────────────────────────────────────────────────
    const MAX_BYTES = 50 * 1024 * 1024 // 50 MB
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'El archivo supera el límite de 50 MB.' },
        { status: 400 }
      )
    }

    const isImage = file.type.startsWith('image/')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const tmpDir = join(tmpdir(), 'mixooh-uploads')
    await mkdir(tmpDir, { recursive: true })

    const inputExt = isImage ? (file.type === 'image/png' ? 'png' : 'jpg') : (file.name.split('.').pop()?.toLowerCase() || 'mp4')
    tempInputPath = join(tmpDir, `${orderId}-${Date.now()}-input.${inputExt}`)
    await writeFile(tempInputPath, buffer)
    console.log(`[upload-video] Temp input written: ${tempInputPath} (${buffer.byteLength} bytes)`)

    // ── Imagen → Convertir a video MP4 en el servidor ─────────────────────────
    let finalBuffer: Buffer
    let duration = 7

    if (isImage) {
      tempOutputPath = join(tmpDir, `${orderId}-${Date.now()}-output.mp4`)
      console.log('[upload-video] Convirtiendo imagen a video MP4 (7s)...')
      await imageToVideoServer(tempInputPath, tempOutputPath, 7, 1280, 720)
      finalBuffer = await readFile(tempOutputPath)
      console.log(`[upload-video] Video generado: ${finalBuffer.byteLength} bytes`)
    } else {
      // ── Video: validar duración con ffprobe ───────────────────────────────
      finalBuffer = buffer
      try {
        const meta = await probeVideo(tempInputPath)
        duration = meta.duration
        console.log(`[upload-video] Duration detected: ${duration}s`)
      } catch (probeErr) {
        console.warn('[upload-video] ffprobe error (skipping duration check):', probeErr)
      }

      const MAX_DURATION = 300
      if (duration > 0 && duration > MAX_DURATION) {
        return NextResponse.json(
          { error: `El video no puede superar ${MAX_DURATION / 60} minutos. Duración detectada: ${Math.round(duration)}s.` },
          { status: 400 }
        )
      }
    }

    // ── Upload to Cloudflare R2 ────────────────────────────────────────────────
    const key = `campaign-videos/${orderId}-${Date.now()}.mp4`
    console.log(`[upload-video] Uploading to R2: ${key}`)

    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: finalBuffer,
          ContentType: 'video/mp4',
          ContentLength: finalBuffer.byteLength,
          CacheControl: 'public, max-age=31536000',
          Metadata: {
            'x-amz-meta-source': 'jmt-marketplace',
          },
        })
      )
    } catch (s3Err: any) {
      console.error('[upload-video] R2 Upload Error:', {
        message: s3Err.message,
        code: s3Err.Code || s3Err.name,
        requestId: s3Err.$metadata?.requestId,
      })
      throw s3Err
    }

    const videoUrl = buildPublicUrl(key)
    console.log(`[upload-video] Uploaded successfully: ${videoUrl}`)

    // ── Update Supabase ────────────────────────────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''

    if (!serviceRoleKey || !supabaseUrl) {
      console.error('[upload-video] Missing env vars for Supabase update')
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta.' },
        { status: 500 }
      )
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: updateData, error: dbError } = await supabase
      .from('orders')
      .update({ status: 'VIDEO_SENT', video_url: videoUrl })
      .eq('id', orderId)
      .select()

    if (dbError) {
      console.error('[upload-video] Supabase update error:', dbError)
      return NextResponse.json(
        { error: `Video subido pero no se actualizó el pedido: ${dbError.message}` },
        { status: 500 }
      )
    }

    if (!updateData || updateData.length === 0) {
      console.warn(`[upload-video] WARNING: No rows updated for orderId=${orderId}`)
    } else {
      console.log('[upload-video] Supabase updated OK')
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
    if (tempInputPath) unlink(tempInputPath).catch(() => {})
    if (tempOutputPath) unlink(tempOutputPath).catch(() => {})
  }
}
