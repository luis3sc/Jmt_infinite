import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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
    const { orderId, fileName, fileType, category = 'video' } = await req.json()

    if (!orderId || !fileName || !fileType) {
      return NextResponse.json(
        { error: 'Parámetros incompletos. Se requiere orderId, fileName y fileType.' },
        { status: 400 }
      )
    }

    // ── Authorization check ────────────────────────────────────────────────────
    const userSupabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await userSupabase.auth.getUser()

    if (authError || !user) {
      console.error('[presigned-url] Auth failure:', authError || 'No user found in cookies')
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para realizar esta acción.' },
        { status: 401 }
      )
    }

    // Usar el cliente de service role para validar la propiedad del pedido
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''

    if (!serviceRoleKey || !supabaseUrl) {
      console.error('[presigned-url] Missing env vars for Supabase authentication bypass')
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
        console.error('[presigned-url] Role check failed. User ID:', user.id, 'Required: admin/gestor, Got:', profile?.role)
        return NextResponse.json(
          { error: 'No tienes permisos para subir archivos a este pedido.' },
          { status: 403 }
        )
      }
    }

    // Sanitizar el nombre de archivo para evitar caracteres extraños en R2
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const folder = category === 'evidence' ? 'campaign-evidence' : 'campaign-videos'
    const subfolder = cleanFileName.startsWith('processed-') ? 'processed' : 'raw'
    const key = `${folder}/${subfolder}/${orderId}/${Date.now()}-${cleanFileName}`

    console.log(`[presigned-url] Generating PUT URL for key: ${key}`)

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: fileType,
    })

    // Expiración en 15 minutos (900 segundos)
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 900 })

    return NextResponse.json({
      success: true,
      uploadUrl,
      key,
    })

  } catch (err: unknown) {
    console.error('[presigned-url] Unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Error interno al generar URL.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
