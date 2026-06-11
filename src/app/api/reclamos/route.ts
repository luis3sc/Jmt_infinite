import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client – bypasses RLS para insertar y leer sin restricciones
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// -------------------------------------------------------------------
// POST /api/reclamos — Registro de un nuevo reclamo
// -------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validación de campos obligatorios
    const requiredFields = [
      'reclamante_nombre',
      'reclamante_tipo_doc',
      'reclamante_num_doc',
      'reclamante_domicilio',
      'reclamante_telefono',
      'reclamante_email',
      'tipo_bien',
      'descripcion_servicio',
      'tipo_disconformidad',
      'detalle_reclamo',
    ] as const

    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === '') {
        return NextResponse.json(
          { error: `El campo '${field}' es obligatorio.` },
          { status: 400 }
        )
      }
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.reclamante_email)) {
      return NextResponse.json(
        { error: 'El correo electrónico no tiene un formato válido.' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    const insertPayload = {
      reclamante_nombre:    String(body.reclamante_nombre).trim(),
      reclamante_tipo_doc:  body.reclamante_tipo_doc,
      reclamante_num_doc:   String(body.reclamante_num_doc).trim(),
      reclamante_domicilio: String(body.reclamante_domicilio).trim(),
      reclamante_telefono:  String(body.reclamante_telefono).trim(),
      reclamante_email:     String(body.reclamante_email).trim().toLowerCase(),
      tipo_bien:            body.tipo_bien,
      descripcion_servicio: String(body.descripcion_servicio).trim(),
      monto_reclamado:      body.monto_reclamado ? Number(body.monto_reclamado) : null,
      tipo_disconformidad:  body.tipo_disconformidad,
      detalle_reclamo:      String(body.detalle_reclamo).trim(),
      pedido_consumidor:    body.pedido_consumidor ? String(body.pedido_consumidor).trim() : null,
      user_id:              body.user_id ?? null,
      // numero_reclamo y secuencia son autogenerados por el trigger
    }

    const { data, error } = await supabase
      .from('reclamos')
      .insert(insertPayload)
      .select('id, numero_reclamo, created_at')
      .single()

    if (error) {
      console.error('[reclamos POST] Supabase error:', error)
      return NextResponse.json(
        { error: 'No se pudo registrar el reclamo. Intente nuevamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        numero_reclamo: data.numero_reclamo,
        id: data.id,
        fecha: data.created_at,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[reclamos POST] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}

// -------------------------------------------------------------------
// GET /api/reclamos?numero=000001-2026  — Consulta pública de estado
// -------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const numero = searchParams.get('numero')

  if (!numero) {
    return NextResponse.json(
      { error: 'Debe proporcionar el parámetro ?numero=XXXXXX-YYYY' },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from('reclamos')
    .select('numero_reclamo, tipo_disconformidad, estado, created_at, fecha_respuesta, reclamante_email')
    .eq('numero_reclamo', numero.trim())
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'No se encontró ningún reclamo con ese número.' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    numero_reclamo:     data.numero_reclamo,
    tipo_disconformidad: data.tipo_disconformidad,
    estado:             data.estado,
    fecha_registro:     data.created_at,
    fecha_respuesta:    data.fecha_respuesta,
  })
}
