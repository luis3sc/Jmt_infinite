import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrderNotaClient from './OrderNotaClient'

interface PageProps {
  params: Promise<{
    orderId: string
  }>
}

export default async function OrderNotaPage({ params }: PageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId
  const supabase = createClient()

  // 1. Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Traer el detalle completo del pedido, perfil de facturación, bookings y organización
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles (
        full_name,
        company_name,
        document_type,
        document_number,
        phone,
        receipt_type,
        email
      ),
      bookings (
        id,
        start_date,
        end_date,
        amount,
        campaign_name,
        panels (
          panel_code,
          width,
          height,
          format,
          face,
          structures (
            address,
            district,
            organization_id,
            organizations (
              name
            )
          )
        )
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-destructive mb-2">Error al cargar la Nota de Pedido</h1>
        <p className="text-sm text-muted-foreground">{error?.message || 'Pedido no encontrado.'}</p>
      </div>
    )
  }

  // 3. Verificar propiedad del pedido o rol administrativo
  if (order.user_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin' && profile?.role !== 'gestor') {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <h1 className="text-xl font-bold text-destructive mb-2">No autorizado</h1>
          <p className="text-sm text-muted-foreground">No tienes permisos para ver esta Nota de Pedido.</p>
        </div>
      )
    }
  }

  return <OrderNotaClient order={order} />
}
