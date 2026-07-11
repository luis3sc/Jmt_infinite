import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const orderId = formData.get('orderId') as string | null
    const fileName = formData.get('fileName') as string | null

    if (!file || !orderId || !fileName) {
      return NextResponse.json(
        { error: 'Faltan parámetros: file, orderId o fileName' },
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

    // Usar el cliente de service role para bypass de RLS en validación
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''

    if (!serviceRoleKey || !supabaseUrl) {
      console.error('[upload-video-proxy] Missing env vars for Supabase service role')
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta.' },
        { status: 500 }
      )
    }

    const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

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

    // Comprobar si el usuario es el dueño del pedido o es admin/gestor
    if (order.user_id !== user.id) {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role !== 'admin' && profile?.role !== 'gestor') {
        return NextResponse.json(
          { error: 'No tienes permisos para subir archivos a este pedido.' },
          { status: 403 }
        )
      }
    }

    // Sanitizar el nombre de archivo para evitar caracteres extraños en R2
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const subfolder = cleanFileName.startsWith('processed-') ? 'processed' : 'raw'
    const key = `campaign-videos/${subfolder}/${orderId}/${Date.now()}-${cleanFileName}`

    console.log(`[upload-video-proxy] Proxying upload for orderId=${orderId}, key=${key}`)

    // Convertir el archivo a un Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir directamente a Cloudflare R2 desde el servidor (sin CORS)
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      })
    )

    console.log(`[upload-video-proxy] Successfully uploaded ${key} directly from server`)

    return NextResponse.json({
      success: true,
      key,
    })

  } catch (err: unknown) {
    console.error('[upload-video-proxy] Unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Error interno al subir el archivo a través del proxy.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
