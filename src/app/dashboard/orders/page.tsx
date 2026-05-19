import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft, AlertCircle } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'
import { OrdersList } from '@/components/dashboard/OrdersList'

export default async function OrdersPage() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      bookings (
        id,
        start_date,
        end_date,
        amount,
        panels (
          panel_code,
          structures (
            address,
            district
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <TopBar right={<AuthButton />} />

      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 pt-20 md:pt-24">

        {/* Back */}
        <Link
          href="/dashboard"
          className="w-fit flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-slate-50 transition-all active:scale-95 group text-[10px] font-black uppercase tracking-widest mb-10"
        >
          <ArrowLeft size={13} className="text-primary group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-slate-500 group-hover:text-foreground">Panel de Control</span>
        </Link>

        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Historial de campañas</p>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none">
                Mis Pedidos
              </h1>
            </div>
            {orders && orders.length > 0 && (
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden md:block">
                {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
              </p>
            )}
          </div>
        </header>

        {error ? (
          <div className="p-10 rounded-lg bg-red-50 border border-red-200 text-center">
            <AlertCircle size={36} className="text-red-500/40 mx-auto mb-3" />
            <h3 className="text-sm font-black text-red-600 uppercase tracking-tight">Error de Conexión</h3>
            <p className="text-slate-500 mt-1 text-xs">{error.message}</p>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="py-24 rounded-lg bg-card border border-dashed border-border text-center shadow-sm">
            <ShoppingBag size={32} className="text-slate-300 mx-auto mb-5" strokeWidth={1} />
            <h2 className="text-lg font-black text-foreground mb-2 uppercase tracking-tight">Sin pedidos</h2>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-sm font-medium">
              Tus compras de publicidad aparecerán aquí una vez que realices tu primer pedido.
            </p>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95"
            >
              Explorar Pantallas
            </Link>
          </div>
        ) : (
          <OrdersList initialOrders={orders} />
        )}
      </div>
    </main>
  )
}
