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
  const { orderId, action, rejectionReason } = body

  if (!orderId || !action || !['APPROVE', 'REJECT'].includes(action)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const newStatus = action === 'APPROVE' ? 'CONFIRMED' : 'REJECTED'

  const { error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      ...(action === 'REJECT' && rejectionReason
        ? { rejection_reason: rejectionReason }
        : {}),
    })
    .eq('id', orderId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, newStatus })
}
