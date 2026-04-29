'use client'

import { useState } from 'react'
import { Search, CheckCircle2, XCircle, UploadCloud, Clock, Building2, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GestorOrderDetail, type Order } from './GestorOrderDetail'

const STATUS: Record<string, { label: string; color: string; dot: string }> = {
  PENDING_UPLOAD:     { label: 'Sin video',     color: 'text-slate-400',   dot: 'bg-slate-400'   },
  VIDEO_SENT:         { label: 'Por revisar',   color: 'text-amber-400',   dot: 'bg-amber-400'   },
  PENDING_VALIDATION: { label: 'En validación', color: 'text-blue-400',    dot: 'bg-blue-400'    },
  CONFIRMED:          { label: 'Aprobado',      color: 'text-emerald-400', dot: 'bg-emerald-400' },
  REJECTED:           { label: 'Rechazado',     color: 'text-red-400',     dot: 'bg-red-400'     },
}

const FILTERS = [
  { value: 'ALL',            label: 'Todos'       },
  { value: 'VIDEO_SENT',     label: 'Por revisar' },
  { value: 'PENDING_UPLOAD', label: 'Sin video'   },
  { value: 'CONFIRMED',      label: 'Aprobados'   },
  { value: 'REJECTED',       label: 'Rechazados'  },
]

export function GestorReviewList({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders]   = useState(initialOrders)
  const [filter, setFilter]   = useState('VIDEO_SENT')
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'ALL' || o.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      (o.profile?.email ?? '').toLowerCase().includes(q) ||
      (o.profile?.full_name ?? '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const handleApprove = async (orderId: string) => {
    const res = await fetch('/api/gestor/review-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action: 'APPROVE' }),
    })
    if (!res.ok) { showToast('Error al aprobar.', false); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CONFIRMED' } : o))
    setSelected(prev => prev?.id === orderId ? { ...prev, status: 'CONFIRMED' } : prev)
    showToast('✓ Video aprobado. Campaña activa.', true)
  }

  const handleReject = async (orderId: string, reason: string) => {
    const res = await fetch('/api/gestor/review-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action: 'REJECT', rejectionReason: reason }),
    })
    if (!res.ok) { showToast('Error al rechazar.', false); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'REJECTED', rejection_reason: reason } : o))
    setSelected(prev => prev?.id === orderId ? { ...prev, status: 'REJECTED', rejection_reason: reason } : prev)
    showToast('Video rechazado.', true)
  }

  return (
    <div className="pb-24 relative">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-6 right-6 z-[999] px-5 py-3 rounded-xl text-sm font-black shadow-2xl text-white ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Buscar por ID, cliente o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/30"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'bg-primary text-white'
                  : 'bg-white/[0.03] text-slate-500 border border-white/5 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-white/5 rounded-xl">
          <Search size={28} className="text-slate-700 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm font-black text-white uppercase tracking-tight mb-1">Sin resultados</p>
          <button
            onClick={() => { setSearch(''); setFilter('ALL') }}
            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline mt-2"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-white/[0.02] border-b border-white/5 text-[10px] font-black text-slate-600 uppercase tracking-widest">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Cliente</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1 text-right">Ver</div>
          </div>

          {filtered.map((order, i) => {
            const st = STATUS[order.status] ?? { label: order.status, color: 'text-slate-400', dot: 'bg-slate-400' }
            const isPending = order.status === 'VIDEO_SENT' || order.status === 'PENDING_VALIDATION'

            return (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className={`w-full text-left grid grid-cols-2 md:grid-cols-12 gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 transition-all hover:bg-white/[0.04] group ${isPending ? 'hover:bg-amber-500/[0.04]' : ''}`}
              >
                <div className="col-span-1 hidden md:flex items-center">
                  <span className="font-mono text-[10px] text-slate-600">{i + 1}</span>
                </div>

                <div className="col-span-2 md:col-span-4 flex flex-col justify-center gap-0.5">
                  <p className="text-sm font-bold text-white truncate">
                    {order.profile?.full_name || order.profile?.email || 'Sin nombre'}
                  </p>
                  {order.profile?.company_name && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Building2 size={9} /> {order.profile.company_name}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-slate-700">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <div className="hidden md:flex md:col-span-2 items-center gap-1.5 text-xs text-slate-500">
                  <Calendar size={11} className="text-primary/40" />
                  {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })}
                </div>

                <div className="hidden md:flex md:col-span-2 items-center text-sm font-black text-white">
                  S/ {Number(order.total_amount).toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot} ${isPending ? 'animate-pulse' : ''}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wide ${st.color}`}>{st.label}</span>
                </div>

                <div className="col-span-1 flex items-center justify-end">
                  {order.status === 'PENDING_UPLOAD' ? (
                    <UploadCloud size={14} className="text-slate-600" />
                  ) : isPending ? (
                    <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg">Revisar</span>
                  ) : order.status === 'CONFIRMED' ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <XCircle size={14} className="text-red-400" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <GestorOrderDetail
            key={selected.id}
            order={selected}
            onClose={() => setSelected(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
