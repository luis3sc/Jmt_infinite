import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Calendar, MapPin, ChevronRight, Package, Clock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch orders with bookings and panels info
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'PENDING_UPLOAD': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
      case 'VIDEO_SENT': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'PENDING_VALIDATION': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmado'
      case 'PENDING_UPLOAD': return 'Pendiente de Video'
      case 'VIDEO_SENT': return 'Video Enviado'
      case 'PENDING_VALIDATION': return 'En Validación'
      case 'CANCELLED': return 'Cancelado'
      default: return status
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0f1d] text-white flex flex-col">
      <TopBar 
        right={<AuthButton />} 
      />

      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 pt-24 md:pt-28">
        {/* Botón Volver - Standardized with Checkout */}
        <Link
          href="/map"
          className="w-fit flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card/50 backdrop-blur-sm border border-border shadow-sm hover:bg-muted hover:border-primary/20 transition-all active:scale-95 group text-sm font-semibold mb-8"
        >
          <ArrowLeft size={18} className="text-primary group-hover:-translate-x-1 transition-transform" />
          <span className="text-muted-foreground group-hover:text-foreground">Volver</span>
        </Link>
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <Package size={20} />
            </div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Área de Cliente</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-2">
            Mis Pedidos
          </h1>
          <p className="text-slate-400 font-medium">
            Gestiona tus campañas y revisa el estado de tus publicaciones.
          </p>
        </header>

        {error ? (
          <div className="p-8 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-bold uppercase tracking-widest">Error al cargar pedidos</p>
            <p className="text-slate-400 mt-2">{error.message}</p>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="p-20 rounded-3xl bg-white/5 border border-white/5 text-center backdrop-blur-sm">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} className="text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">No tienes pedidos aún</h2>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">
              Tus compras de publicidad aparecerán aquí una vez que realices tu primer pedido.
            </p>
            <Link 
              href="/map" 
              className="w-fit flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card/50 backdrop-blur-sm border border-border shadow-sm hover:bg-muted hover:border-primary/20 transition-all active:scale-95 group text-sm font-semibold"
            >
              <span className="text-muted-foreground group-hover:text-foreground">Explorar</span>
              <ChevronRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Link
                href={`/order-success/${order.id}`} 
                key={order.id}
                className="block group relative bg-[#0d1326] border border-white/5 rounded-3xl overflow-hidden transition-all hover:border-white/10 hover:shadow-2xl hover:shadow-black/50 cursor-pointer"
              >
                {/* Header del Pedido */}
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pedido ID</p>
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className="text-lg font-black text-white uppercase tracking-tight font-mono">
                      #{order.id.slice(0, 8)}...
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Calendar size={14} />
                        <span>{new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Clock size={14} />
                        <span>{new Date(order.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 md:text-right">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Monto Total</p>
                      <p className="text-2xl font-black text-white leading-none">
                        S/ {order.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div 
                      className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 group-hover:text-primary group-hover:border-primary/20 group-hover:bg-primary/5 transition-all"
                    >
                      <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Sub-detalle: Bookings */}
                <div className="px-6 pb-6 md:px-8 md:pb-8">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 space-y-4">
                    {order.bookings?.map((booking: any) => (
                      <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-slate-800 rounded-xl text-primary flex-shrink-0">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase tracking-tight mb-0.5">
                              {booking.panels?.panel_code}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {booking.panels?.structures?.address}, {booking.panels?.structures?.district}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 md:text-right">
                          <div className="flex flex-col">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Período</p>
                            <p className="text-[11px] text-slate-300 font-bold">
                              {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col min-w-[80px]">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Subtotal</p>
                            <p className="text-[11px] text-white font-black">
                              S/ {booking.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Bar Indicator */}
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
