'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search, Upload, AlertCircle, CheckCircle2,
  Clock, XCircle, Info, ExternalLink, FileText,
  MapPin, ChevronDown, ChevronUp, Calendar
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface OrdersListProps {
  initialOrders: any[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  CONFIRMED:          { label: 'Activo',            color: 'text-emerald-400', dot: 'bg-emerald-400' },
  PENDING_UPLOAD:     { label: 'Pendiente de video', color: 'text-amber-400',  dot: 'bg-amber-400' },
  VIDEO_SENT:         { label: 'Video enviado',      color: 'text-blue-400',   dot: 'bg-blue-400' },
  PENDING_VALIDATION: { label: 'En validación',      color: 'text-purple-400', dot: 'bg-purple-400' },
  REJECTED:           { label: 'Rechazado',          color: 'text-red-400',    dot: 'bg-red-400' },
  CANCELLED:          { label: 'Cancelado',          color: 'text-slate-500',  dot: 'bg-slate-500' },
}

const FILTERS = [
  { value: 'ALL',                label: 'Todos' },
  { value: 'CONFIRMED',          label: 'Activos' },
  { value: 'PENDING_UPLOAD',     label: 'Sin video' },
  { value: 'VIDEO_SENT',         label: 'En revisión' },
  { value: 'REJECTED',           label: 'Rechazados' },
]

export function OrdersList({ initialOrders }: OrdersListProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [expanded, setExpanded] = useState<string[]>([])

  const toggle = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const filtered = initialOrders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || o.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6 pb-24">

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Buscar por ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
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

      {/* TABLE HEADER — desktop only */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-white/5">
        <p className="col-span-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">ID Pedido</p>
        <p className="col-span-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Pantallas</p>
        <p className="col-span-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">Fecha</p>
        <p className="col-span-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">Estado</p>
        <p className="col-span-2 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Total</p>
      </div>

      {/* ROWS */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? filtered.map((order, i) => {
            const status = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'text-slate-400', dot: 'bg-slate-400' }
            const isExpanded = expanded.includes(order.id)

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden"
              >
                {/* MAIN ROW */}
                <button
                  onClick={() => toggle(order.id)}
                  className="w-full text-left"
                >
                  <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4 px-4 py-4 items-center">
                    {/* ID */}
                    <div className="md:col-span-3">
                      <p className="text-[10px] text-slate-600 mb-0.5 md:hidden">Pedido</p>
                      <p className="font-mono text-xs font-bold text-white">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>

                    {/* Pantallas preview */}
                    <div className="md:col-span-3 flex flex-wrap gap-1.5">
                      {order.bookings?.slice(0, 2).map((b: any, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-medium text-slate-400">
                          <MapPin size={9} className="text-primary/60 shrink-0" />
                          {b.panels?.panel_code}
                        </span>
                      ))}
                      {order.bookings?.length > 2 && (
                        <span className="text-[10px] text-slate-600 self-center">
                          +{order.bookings.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Fecha */}
                    <div className="md:col-span-2 hidden md:block">
                      <p className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                    </div>

                    {/* Estado */}
                    <div className="md:col-span-2 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                      <span className={`text-[10px] font-black uppercase tracking-wide ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="md:col-span-2 text-right flex items-center justify-end gap-2">
                      <span className="text-sm font-black text-white">
                        S/ {order.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                      {isExpanded
                        ? <ChevronUp size={14} className="text-slate-600 shrink-0" />
                        : <ChevronDown size={14} className="text-slate-600 shrink-0" />
                      }
                    </div>
                  </div>
                </button>

                {/* EXPANDED DETAIL */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="px-4 py-5 space-y-4">

                        {/* Bookings table */}
                        <div>
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Detalle de pantallas</p>
                          <div className="space-y-1.5">
                            {order.bookings?.map((b: any) => (
                              <div key={b.id} className="grid grid-cols-3 gap-3 py-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                                <div className="flex items-center gap-2">
                                  <MapPin size={11} className="text-primary/50 shrink-0" />
                                  <span className="font-bold text-white">{b.panels?.panel_code}</span>
                                </div>
                                <p className="text-slate-500 truncate">{b.panels?.structures?.district}</p>
                                <p className="text-right font-black text-primary">S/ {b.amount?.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions row */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {order.status === 'PENDING_UPLOAD' && (
                            <Link
                              href={`/order-success/${order.id}`}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95"
                            >
                              <Upload size={13} />
                              Subir Video
                            </Link>
                          )}
                          {order.status === 'REJECTED' && (
                            <Link
                              href={`/order-success/${order.id}`}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95"
                            >
                              <AlertCircle size={13} />
                              Corregir Video
                            </Link>
                          )}
                          {(order.status === 'CONFIRMED' || order.status === 'VIDEO_SENT' || order.status === 'PENDING_VALIDATION') && (
                            <Link
                              href={`/order-success/${order.id}`}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                            >
                              <ExternalLink size={13} />
                              Ver Campaña
                            </Link>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); alert(`Preparando factura #${order.id.slice(0, 8).toUpperCase()}...`) }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/[0.05] transition-all active:scale-95"
                          >
                            <FileText size={13} />
                            Factura
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          }) : (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-lg">
              <Search size={28} className="text-slate-700 mx-auto mb-4" strokeWidth={1} />
              <p className="text-sm font-black text-white uppercase tracking-tight mb-1">Sin resultados</p>
              <p className="text-xs text-slate-500 mb-5">No coinciden pedidos con tu búsqueda o filtro.</p>
              <button
                onClick={() => { setSearch(''); setFilter('ALL') }}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline underline-offset-4"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
