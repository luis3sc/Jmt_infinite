'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Clock, CheckCircle2, 
  AlertCircle, Eye
} from 'lucide-react'
import { motion } from 'framer-motion'

interface DashboardSummaryProps {
  orders: any[]
}

export function DashboardSummary({ orders }: DashboardSummaryProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeCampaigns = orders.filter(o => o.status === 'CONFIRMED').length
  const pendingUploads = orders.filter(o => o.status === 'PENDING_UPLOAD').length
  const rejectedOrders = orders.filter(o => o.status === 'REJECTED').length
  const inReviewOrders = orders.filter(o => o.status === 'VIDEO_SENT' || o.status === 'PENDING_VALIDATION').length
  const totalOrders = orders.length
  
  const recentOrder = orders[0]

  // Helper for consistent formatting
  const formatCurrency = (amount: number) => {
    if (!mounted) return `S/ ${amount}`
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!mounted) return ''
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
    })
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* STATS ROW - HORIZONTAL LAYOUT */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="p-8 rounded-lg bg-white/[0.02] backdrop-blur-xl border border-white/5 flex items-center gap-6 group hover:bg-white/[0.04] transition-all duration-500">
          <div className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
            {activeCampaigns}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Campañas</p>
            <p className="text-xs md:text-sm font-black text-emerald-500 uppercase tracking-tight">Activas</p>
          </div>
        </div>

        <div className="p-8 rounded-lg bg-white/[0.02] backdrop-blur-xl border border-white/5 flex items-center gap-6 group hover:bg-white/[0.04] transition-all duration-500">
          <div className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
            {pendingUploads + rejectedOrders}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Campañas</p>
            <p className="text-xs md:text-sm font-black text-amber-500 uppercase tracking-tight">Pendientes</p>
          </div>
        </div>

        <Link 
          href="/dashboard/orders"
          className="p-8 rounded-lg bg-white/[0.02] backdrop-blur-xl border border-white/5 flex items-center gap-6 group hover:bg-white/[0.04] hover:border-primary/20 transition-all duration-500"
        >
          <div className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none group-hover:text-primary transition-colors">
            {totalOrders}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total de</p>
            <p className="text-xs md:text-sm font-black text-primary uppercase tracking-tight group-hover:scale-105 origin-left transition-transform">Pedidos</p>
          </div>
        </Link>

        <div className="p-8 rounded-lg bg-white/[0.02] backdrop-blur-xl border border-white/5 flex items-center gap-6 group hover:bg-white/[0.04] transition-all duration-500">
          <div className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
            {inReviewOrders}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">En</p>
            <p className="text-xs md:text-sm font-black text-blue-400 uppercase tracking-tight">Revisión</p>
          </div>
        </div>
      </section>

      {/* ACTIONS SECTION */}
      <section className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acciones Necesarias</h3>
        </div>
        
        <div className="space-y-4">
          {rejectedOrders > 0 ? (
            <div className="p-8 rounded-lg bg-slate-900/20 backdrop-blur-xl border border-red-500/10 flex flex-col sm:flex-row gap-6 items-start sm:items-center group hover:bg-red-500/[0.03] transition-all duration-300">
              <div className="p-4 bg-red-500/10 rounded-lg text-red-500 shrink-0">
                <AlertCircle size={28} />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Corregir Material</h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md">
                  Tienes {rejectedOrders} {rejectedOrders === 1 ? 'campaña rechazada' : 'campañas rechazadas'}. Es necesario subir un video corregido para iniciar la exhibición.
                </p>
              </div>
              <Link 
                href="/dashboard/orders"
                className="w-full sm:w-auto text-center px-8 py-4 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95"
              >
                Corregir Ahora
              </Link>
            </div>
          ) : null}

          {pendingUploads > 0 ? (
            <div className="p-8 rounded-lg bg-slate-900/20 backdrop-blur-xl border border-amber-500/10 flex flex-col sm:flex-row gap-6 items-start sm:items-center group hover:bg-amber-500/[0.03] transition-all duration-300">
              <div className="p-4 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
                <Clock size={28} />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Subir Contenido</h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md">
                  Tienes {pendingUploads} {pendingUploads === 1 ? 'campaña pausada' : 'campañas pausadas'}. El video es necesario para iniciar la pauta publicitaria.
                </p>
              </div>
              <Link 
                href="/dashboard/orders"
                className="w-full sm:w-auto text-center px-8 py-4 rounded-2xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
              >
                Subir Video
              </Link>
            </div>
          ) : null}

          {rejectedOrders === 0 && pendingUploads === 0 && (
            <div className="p-10 rounded-lg bg-white/[0.01] backdrop-blur-md border border-dashed border-white/5 flex flex-col items-center text-center gap-6 py-20">
              <div className="w-16 h-16 bg-emerald-500/5 rounded-lg flex items-center justify-center text-emerald-500/40 border border-emerald-500/10">
                <CheckCircle2 size={32} strokeWidth={1.5} />
              </div>
              <div className="max-w-xs">
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Todo en Orden</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  No tienes acciones pendientes por el momento. Tus campañas se encuentran en proceso o activas.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
