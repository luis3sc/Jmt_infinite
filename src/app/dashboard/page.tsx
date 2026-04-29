import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, ArrowLeft, AlertCircle, ShoppingBag, PlusCircle } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'
import { DashboardSummary } from '@/components/dashboard/DashboardSummary'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch orders for summary
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      bookings (
        id,
        panels (
          panel_code
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#0a0f1d] text-white flex flex-col">
      <TopBar
        right={<AuthButton />}
      />

      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 pt-20 md:pt-24">
        {/* Botón Volver */}
        <Link
          href="/map"
          className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 shadow-sm hover:bg-white/[0.08] hover:border-primary/20 transition-all active:scale-95 group text-[10px] font-black uppercase tracking-widest mb-8"
        >
          <ArrowLeft size={14} className="text-primary group-hover:-translate-x-1 transition-transform" />
          <span className="text-slate-400 group-hover:text-white">Volver al Mapa</span>
        </Link>

        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
                Bienvenido, <span className="text-primary">{user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}</span>
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">Gestiona tus campañas y monitorea su rendimiento en tiempo real.</p>
            </div>

            <Link
              href="/dashboard/orders"
              className="w-fit flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-primary/20 transition-all active:scale-95 group shadow-sm"
            >
              <ShoppingBag size={16} className="text-primary group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-white">Ver mis Pedidos</span>
            </Link>
          </div>
        </header>

        {error ? (
          <div className="p-12 rounded-3xl bg-red-500/5 border border-red-500/10 text-center">
            <AlertCircle size={48} className="text-red-500/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-400 uppercase tracking-tight">Error de Conexión</h3>
            <p className="text-slate-500 mt-2 text-sm">{error.message}</p>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="p-12 md:p-24 rounded-[2.5rem] bg-white/[0.01] border border-dashed border-white/5 text-center backdrop-blur-md relative overflow-hidden group">
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-10 border border-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-700">
                <LayoutDashboard size={42} className="text-primary/40" strokeWidth={1} />
              </div>
              <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Sin actividad reciente</h2>
              <p className="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed mb-10">
                Tu panel de control está listo. Aquí podrás gestionar tus campañas y monitorear su impacto una vez que realices tu primer pedido desde nuestra red de pantallas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/map"
                  className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 active:scale-95"
                >
                  <PlusCircle size={18} />
                  Explorar Pantallas
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 active:scale-95"
                >
                  Ver mis pedidos
                </Link>
              </div>
            </div>

            {/* Background Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[120px] rounded-full -z-10" />
          </div>
        ) : (
          <DashboardSummary orders={orders} />
        )}
      </div>
    </main>
  )
}


