import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
