import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createRequire } from 'module'
import { writeFile, unlink, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { Readable } from 'stream'

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

// R2 public URL base
function buildPublicUrl(key: string): string {
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim()?.replace(/\/$/, '')
  if (publicBase) return `${publicBase}/${key}`
  const base = process.env.CLOUDFLARE_ENDPOINT!.replace(/\/$/, '')
  return `${base}/${BUCKET}/${key}`
}

// Convert a stream to a Buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

// Convert static image to a 7s video
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
        `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
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

// Transcode video to match physical screen specifications (muted, exact resolution, 7s max)
function videoToVideoServer(
  inputPath: string,
  outputPath: string,
  durationSeconds: number = 7,
  width: number = 1280,
  height: number = 720
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        `-t ${durationSeconds}`,
        `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
        '-c:v libx264',
        '-preset ultrafast',
        '-an', // REMOVE AUDIO channel (DOOH standards)
        '-r', '25',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
      ])
      .on('start', (cmd: string) => console.log('[upload-video] ffmpeg video→video cmd:', cmd))
      .on('error', (err: Error) => {
        console.error('[upload-video] ffmpeg video→video error:', err.message)
        reject(err)
      })
      .on('end', () => resolve())
      .save(outputPath)
  })
}

// Asynchronous background transcoding task
async function processMediaBackground(
  orderId: string,
  rawKey: string,
  isImage: boolean,
  fileType: string,
  bookings: any[],
  adminSupabase: any
) {
  let tempInputPath: string | null = null
  const tempOutputPaths: string[] = []

  try {
    console.log(`[upload-video-async] Starting background process for orderId=${orderId}, rawKey=${rawKey}`)

    // 1. Update order status to PROCESSING
    await adminSupabase
      .from('orders')
      .update({ status: 'PROCESSING_VIDEO' })
      .eq('id', orderId)

    // 2. Create local temp directory
    const tmpDir = join(tmpdir(), `mixooh-async-${orderId}`)
    await mkdir(tmpDir, { recursive: true })

    // 3. Download raw file from R2
    console.log(`[upload-video-async] Downloading raw object from R2: ${rawKey}`)
    const getObj = await r2.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: rawKey,
      })
    )

    const rawBuffer = await streamToBuffer(getObj.Body as Readable)
    const fileExt = isImage ? (fileType === 'image/png' ? 'png' : 'jpg') : 'mp4'
    tempInputPath = join(tmpDir, `input.${fileExt}`)
    await writeFile(tempInputPath, rawBuffer)
    console.log(`[upload-video-async] Temp raw file written: ${tempInputPath}`)

    // Cache to avoid transcoding the exact same resolution multiple times in the same order
    const resolutionCache: Record<string, string> = {}
    let primaryVideoUrl: string | null = null

    // 4. Process each booking based on its panel native resolution and duration
    for (const booking of bookings) {
      // Default to 1280x720 and 7s if not specified
      let width = booking.panels?.resolution_width || 1280
      let height = booking.panels?.resolution_height || 720

      // FFmpeg libx264/yuv420p require even dimensions (divisible by 2)
      // We round down (subtract 1 pixel) to ensure it remains even and doesn't overflow physical screen pixels
      if (width % 2 !== 0) {
        width = width - 1
      }
      if (height % 2 !== 0) {
        height = height - 1
      }

      const duration = booking.panels?.slot_duration_seconds || 7
      const resKey = `${width}x${height}-${duration}s`

      console.log(`[upload-video-async] Booking ${booking.id} requires resolution and duration: ${resKey}`)

      let processedKey: string

      if (resolutionCache[resKey]) {
        processedKey = resolutionCache[resKey]
        console.log(`[upload-video-async] Resolution/Duration ${resKey} found in cache. Reusing key: ${processedKey}`)
      } else {
        const outPath = join(tmpDir, `output-${resKey}.mp4`)
        tempOutputPaths.push(outPath)

        if (isImage) {
          console.log(`[upload-video-async] Converting image to video: ${resKey}`)
          await imageToVideoServer(tempInputPath, outPath, duration, width, height)
        } else {
          console.log(`[upload-video-async] Transcoding video to DOOH standard: ${resKey}`)
          await videoToVideoServer(tempInputPath, outPath, duration, width, height)
        }

        const processedBuffer = await readFile(outPath)
        processedKey = `campaign-videos/processed/${orderId}/${booking.id}-${resKey}.mp4`

        console.log(`[upload-video-async] Uploading processed video to R2: ${processedKey}`)
        await r2.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: processedKey,
            Body: processedBuffer,
            ContentType: 'video/mp4',
            ContentLength: processedBuffer.byteLength,
            CacheControl: 'public, max-age=31536000',
            Metadata: {
              'x-amz-meta-source': 'jmt-marketplace-async',
            },
          })
        )

        resolutionCache[resKey] = processedKey
      }

      const publicVideoUrl = buildPublicUrl(processedKey)
      if (!primaryVideoUrl) primaryVideoUrl = publicVideoUrl

      // Update booking with the perfectly resized video
      console.log(`[upload-video-async] Updating booking ${booking.id} in DB with video: ${publicVideoUrl}`)
      await adminSupabase
        .from('bookings')
        .update({ video_url: publicVideoUrl })
        .eq('id', booking.id)
    }

    // 5. Update final order status to VIDEO_SENT
    if (primaryVideoUrl) {
      console.log(`[upload-video-async] All pieces completed. Setting order status to VIDEO_SENT.`)
      await adminSupabase
        .from('orders')
        .update({ status: 'VIDEO_SENT', video_url: primaryVideoUrl })
        .eq('id', orderId)
    }

  } catch (asyncErr) {
    console.error(`[upload-video-async] Error in background transcoding:`, asyncErr)
    // Rollback order status to let user know it failed, clearing video_url to prevent stale client redirect
    await adminSupabase
      .from('orders')
      .update({ 
        status: 'PENDING_UPLOAD', 
        video_url: null, 
        rejection_reason: 'Error al transcodificar el video en el servidor.' 
      })
      .eq('id', orderId)
  } finally {
    // 6. Mandatory cleanup of all temp files
    console.log(`[upload-video-async] Cleaning up /tmp folder`)
    if (tempInputPath) await unlink(tempInputPath).catch(() => {})
    for (const outPath of tempOutputPaths) {
      await unlink(outPath).catch(() => {})
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, rawKey, isImage, fileType, processedVideos } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Falta parámetro orderId.' },
        { status: 400 }
      )
    }

    // ── Authorization check ────────────────────────────────────────────────────
    const userSupabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para realizar esta acción.' },
        { status: 401 }
      )
    }

    // Usar el cliente de service role para bypass de RLS en consultas complejas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''

    if (!serviceRoleKey || !supabaseUrl) {
      console.error('[upload-video] Missing env vars for Supabase authentication bypass')
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta.' },
        { status: 500 }
      )
    }

    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // Comprobar la propiedad del pedido
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'El pedido no existe o no se pudo verificar.' },
        { status: 404 }
      )
    }

    if (order.user_id !== user.id) {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role !== 'admin' && profile?.role !== 'gestor') {
        return NextResponse.json(
          { error: 'No tienes permisos para modificar este pedido.' },
          { status: 403 }
        )
      }
    }

    // ── Flujo 1: Si ya viene procesado desde el cliente ──────────────────────────
    if (processedVideos && Array.isArray(processedVideos)) {
      console.log(`[upload-video] Procesado en cliente. Guardando ${processedVideos.length} videos para el pedido ${orderId}`)

      let primaryVideoUrl = ''
      for (const item of processedVideos) {
        if (!item.bookingId || !item.key) {
          return NextResponse.json(
            { error: 'Formato inválido en processedVideos. Cada objeto debe tener bookingId y key.' },
            { status: 400 }
          )
        }

        const publicVideoUrl = buildPublicUrl(item.key)
        if (!primaryVideoUrl) primaryVideoUrl = publicVideoUrl

        console.log(`[upload-video] Actualizando booking ${item.bookingId} con video procesado: ${publicVideoUrl}`)
        const { error: bookingErr } = await adminSupabase
          .from('bookings')
          .update({ video_url: publicVideoUrl })
          .eq('id', item.bookingId)

        if (bookingErr) throw bookingErr
      }

      if (primaryVideoUrl) {
        console.log(`[upload-video] Actualizando pedido ${orderId} con status VIDEO_SENT y video: ${primaryVideoUrl}`)
        const { error: orderErr } = await adminSupabase
          .from('orders')
          .update({ status: 'VIDEO_SENT', video_url: primaryVideoUrl })
          .eq('id', orderId)

        if (orderErr) throw orderErr
      }

      return NextResponse.json(
        { 
          success: true, 
          message: 'Videos procesados guardados exitosamente.',
          videoUrl: primaryVideoUrl 
        },
        { status: 200 }
      )
    }

    // ── Flujo 2: Transcodificación en servidor (Fallback clásico) ───────────────
    if (!rawKey || isImage === undefined || !fileType) {
      return NextResponse.json(
        { error: 'Parámetros incompletos. Se requiere rawKey, isImage y fileType para transcodificar en servidor.' },
        { status: 400 }
      )
    }

    // Obtener los bookings y las resoluciones/duraciones nativas de las pantallas asociadas
    const { data: bookings, error: bookingsError } = await adminSupabase
      .from('bookings')
      .select('id, panel_id, panels(resolution_width, resolution_height, slot_duration_seconds)')
      .eq('order_id', orderId)

    if (bookingsError || !bookings || bookings.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron reservas vinculadas a este pedido.' },
        { status: 400 }
      )
    }

    // Disparar proceso asíncrono
    waitUntil(processMediaBackground(orderId, rawKey, isImage, fileType, bookings, adminSupabase))

    return NextResponse.json(
      { success: true, message: 'Procesamiento asíncrono en servidor iniciado.' },
      { status: 202 }
    )

  } catch (err: unknown) {
    console.error('[upload-video] Unexpected error in orchestration POST:', err)
    const message = err instanceof Error ? err.message : 'Error interno del servidor.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
