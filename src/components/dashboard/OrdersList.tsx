'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search, Upload, AlertCircle, CheckCircle2,
  Clock, XCircle, Info, ExternalLink, FileText,
  MapPin, ChevronDown, ChevronUp, Calendar
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { OrderTrackingStepper, type OrderStatus } from '@/components/ui/OrderTrackingStepper'

interface OrdersListProps {
  initialOrders: any[]
}
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  CONFIRMED:          { label: '¡Al aire!',          color: 'text-emerald-500', dot: 'bg-emerald-500' },
  PENDING_UPLOAD:     { label: 'Falta subir foto/video', color: 'text-amber-500',  dot: 'bg-amber-500' },
  VIDEO_SENT:         { label: 'Revisando diseño',   color: 'text-blue-400',    dot: 'bg-blue-400' },
  PENDING_VALIDATION: { label: 'Revisando diseño',   color: 'text-blue-400',    dot: 'bg-blue-400' },
  REJECTED:           { label: 'Observado (Por corregir)', color: 'text-red-500',    dot: 'bg-red-500' },
  CANCELLED:          { label: 'Cancelado',          color: 'text-muted-foreground',  dot: 'bg-muted-foreground/60' },
}

const FILTERS = [
  { value: 'ALL',                label: 'Todos' },
  { value: 'CONFIRMED',          label: 'Al aire' },
  { value: 'PENDING_UPLOAD',     label: 'Falta subir' },
  { value: 'VIDEO_SENT',         label: 'En revisión' },
  { value: 'REJECTED',           label: 'Por corregir' },
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
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-muted/10 h-auto"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              onClick={() => setFilter(f.value)}
              className="px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap h-auto"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* TABLE HEADER — desktop only */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-border/50">
        <p className="col-span-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID Pedido</p>
        <p className="col-span-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pantallas</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estado</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Total</p>
      </div>

      {/* ROWS */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? filtered.map((order, i) => {
            const status = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'text-muted-foreground', dot: 'bg-muted-foreground/40' }
            const isExpanded = expanded.includes(order.id)

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="rounded-lg border border-border bg-card hover:bg-muted/10 hover:border-border/80 transition-all overflow-hidden"
              >
                {/* MAIN ROW */}
                <Button
                  variant="ghost"
                  onClick={() => toggle(order.id)}
                  className="w-full text-left block h-auto p-0 hover:bg-transparent rounded-none"
                >
                  <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4 px-4 py-4 items-center">
                    {/* ID */}
                    <div className="md:col-span-3">
                      <p className="text-[10px] text-muted-foreground mb-0.5 md:hidden">Pedido</p>
                      <p className="font-mono text-xs font-bold text-foreground">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>

                    {/* Pantallas preview */}
                    <div className="md:col-span-3 flex flex-wrap gap-1.5">
                      {order.bookings?.slice(0, 2).map((b: any, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted border border-border text-[10px] font-semibold text-muted-foreground">
                          <MapPin size={9} className="text-muted-foreground shrink-0" />
                          {b.panels?.panel_code}
                        </span>
                      ))}
                      {order.bookings?.length > 2 && (
                        <span className="text-[10px] text-muted-foreground self-center font-medium">
                          +{order.bookings.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Fecha */}
                    <div className="md:col-span-2 hidden md:block">
                      <p className="text-xs text-muted-foreground font-medium">
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
                      <span className="text-sm font-black text-foreground">
                        S/ {order.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                      {isExpanded
                        ? <ChevronUp size={14} className="text-muted-foreground shrink-0" />
                        : <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                      }
                    </div>
                  </div>
                </Button>

                {/* EXPANDED DETAIL */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border/50 bg-muted/10"
                    >
                      <div className="px-4 py-5 space-y-4">

                        {/* Order Tracking Stepper */}
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                            Seguimiento de tu anuncio
                          </p>
                          <OrderTrackingStepper
                            status={order.status as OrderStatus}
                            layout="auto"
                          />
                        </div>

                        {/* Bookings table */}
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Detalle de pantallas</p>
                          <div className="space-y-1.5">
                            {order.bookings?.map((b: any) => (
                              <div key={b.id} className="grid grid-cols-3 gap-3 py-2.5 px-3 rounded-lg bg-card border border-border text-xs">
                                <div className="flex items-center gap-2">
                                  <MapPin size={11} className="text-muted-foreground shrink-0" />
                                  <span className="font-bold text-foreground">{b.panels?.panel_code}</span>
                                </div>
                                <p className="text-muted-foreground truncate font-medium">{b.panels?.structures?.district}</p>
                                <p className="text-right font-black text-foreground">S/ {b.amount?.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions row */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {order.status === 'PENDING_UPLOAD' && (
                            <Link
                              href={`/order-success/${order.id}`}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                            >
                              <Upload size={13} />
                              Subir Foto o Video
                            </Link>
                          )}
                          {order.status === 'REJECTED' && (
                            <Link
                              href={`/order-success/${order.id}`}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                            >
                              <AlertCircle size={13} />
                              Corregir Foto o Video
                            </Link>
                          )}
                          {(order.status === 'CONFIRMED' || order.status === 'VIDEO_SENT' || order.status === 'PENDING_VALIDATION') && (
                            <Link
                              href={`/order-success/${order.id}`}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all active:scale-95"
                            >
                              <ExternalLink size={13} />
                              Ver mi Anuncio
                            </Link>
                          )}
                          <Button
                            variant="outline"
                            onClick={e => { e.stopPropagation(); alert(`Preparando factura #${order.id.slice(0, 8).toUpperCase()}...`) }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest h-auto bg-muted/40"
                          >
                            <FileText size={13} />
                            Factura
                          </Button>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          }) : (
            <div className="py-20 text-center border border-dashed border-border rounded-lg bg-muted/10">
              <Search size={28} className="text-muted-foreground mx-auto mb-4" strokeWidth={1} />
              <p className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Sin resultados</p>
              <p className="text-xs text-muted-foreground mb-5">No coinciden pedidos con tu búsqueda o filtro.</p>
              <Button
                variant="link"
                onClick={() => { setSearch(''); setFilter('ALL') }}
                className="text-[10px] font-black text-primary uppercase tracking-widest h-auto p-0"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
