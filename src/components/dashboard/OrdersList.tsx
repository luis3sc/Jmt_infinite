'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Search, Upload, AlertCircle, CheckCircle2,
  Clock, XCircle, Info, ExternalLink, FileText,
  MapPin, ChevronDown, ChevronUp, Calendar, Eye, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { OrderTrackingStepper, type OrderStatus } from '@/components/ui/OrderTrackingStepper'
import { Dialog } from '@/components/ui/Dialog'

interface OrdersListProps {
  initialOrders: any[]
}
import { Input } from "@/components/ui/Input"
import { Button, buttonVariants, buttonSizes } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  CONFIRMED: { label: '¡Activa!', color: 'text-emerald-500', dot: 'bg-emerald-500' },
  PENDING_UPLOAD: { label: 'Falta subir foto/video', color: 'text-amber-500', dot: 'bg-amber-500' },
  VIDEO_SENT: { label: 'Revisando diseño', color: 'text-blue-400', dot: 'bg-blue-400' },
  PENDING_VALIDATION: { label: 'Revisando diseño', color: 'text-blue-400', dot: 'bg-blue-400' },
  APPROVED: { label: 'Aprobado', color: 'text-emerald-500', dot: 'bg-emerald-500' },
  SENT_TO_PROVIDER: { label: 'Programado', color: 'text-purple-400', dot: 'bg-purple-400' },
  REJECTED: { label: 'Observado (Por corregir)', color: 'text-red-500', dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelado', color: 'text-muted-foreground', dot: 'bg-muted-foreground/60' },
}

const FILTERS = [
  { value: 'CONFIRMED', label: 'Activa' },
  { value: 'PENDING_UPLOAD', label: 'Falta subir' },
  { value: 'VIDEO_SENT', label: 'En revisión' },
  { value: 'REJECTED', label: 'Por corregir' },
]

export function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('CONFIRMED')
  const [expanded, setExpanded] = useState<string[]>([])
  const [selectedEvidenceOrder, setSelectedEvidenceOrder] = useState<any | null>(null)
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('orders-list-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('[realtime] Order list update:', payload.new)
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.new.id ? { ...o, ...payload.new } : o
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const toggle = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase())
    let matchFilter = o.status === filter
    if (filter === 'VIDEO_SENT') {
      matchFilter = ['VIDEO_SENT', 'PENDING_VALIDATION', 'APPROVED', 'SENT_TO_PROVIDER'].includes(o.status)
    }
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6 pb-24">

      {/* TOOLBAR */}
      <div className="flex flex-col gap-6">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-background border-border py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-muted/5 h-auto rounded-md"
          />
        </div>

        {/* TABS */}
        <div className="relative border-b border-border/50 flex items-center">
          <div className="md:hidden text-muted-foreground/50 pr-2">
            <ChevronLeft size={16} />
          </div>
          <div className="flex-1 flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "pb-3 text-xs md:text-sm font-medium whitespace-nowrap transition-colors relative",
                  filter === f.value ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
                {filter === f.value && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
          <div className="md:hidden text-muted-foreground/50 pl-2">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>

      {/* TABLE HEADER — desktop only */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-border/50">
        <p className="col-span-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Campaña</p>
        <p className="col-span-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pantallas</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estado</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Total</p>
      </div>

      {/* ROWS */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? filtered.map((order, i) => {
            const isExpanded = expanded.includes(order.id)

            const firstBooking = order.bookings?.[0]
            const endDateObj = firstBooking?.end_date ? new Date(firstBooking.end_date) : null
            if (endDateObj) {
              endDateObj.setHours(23, 59, 59, 999)
            }
            const isExpired = !['CONFIRMED', 'CANCELLED'].includes(order.status) && endDateObj !== null && endDateObj < new Date()

            const status = isExpired
              ? { label: 'Vencido (No se activó)', color: 'text-red-500 font-bold', dot: 'bg-red-500' }
              : (STATUS_CONFIG[order.status] ?? { label: order.status, color: 'text-muted-foreground', dot: 'bg-muted-foreground/40' })

            const startDate = firstBooking?.start_date ? new Date(firstBooking.start_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : 'N/A'
            const endDate = firstBooking?.end_date ? new Date(firstBooking.end_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : 'N/A'
            const durationText = `${startDate} - ${endDate}`

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="rounded-lg border border-border bg-card hover:bg-muted/10 hover:border-primary transition-all overflow-hidden"
              >
                {/* MAIN ROW */}
                <div
                  className="w-full text-left block h-auto p-0 bg-transparent cursor-pointer relative"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.cta-button')) return;
                    toggle(order.id);
                  }}
                >
                  <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-4 py-4 md:items-center">

                    {/* MOBILE TOP ROW: Duration & Status */}
                    <div className="flex justify-between items-start md:hidden mb-1">
                      <div className="flex flex-col">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Campaña</p>
                        <p className="text-xs font-bold text-foreground">
                          {durationText}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                        <span className={`text-[10px] font-black uppercase tracking-wide ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* MOBILE PRICE ROW */}
                    <div className="flex justify-between items-center md:hidden mb-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground">
                          S/ {order.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                        {isExpanded
                          ? <ChevronUp size={14} className="text-muted-foreground shrink-0" />
                          : <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                        }
                      </div>
                    </div>

                    {/* DESKTOP Duration */}
                    <div className="hidden md:block md:col-span-3">
                      <p className="text-[10px] text-muted-foreground mb-0.5 md:hidden">Campaña</p>
                      <p className="text-xs font-bold text-foreground">
                        {durationText}
                      </p>
                    </div>

                    {/* DESKTOP Pantallas preview (HIDDEN ON MOBILE) */}
                    <div className="hidden md:flex md:col-span-3 flex-wrap gap-1.5">
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

                    {/* DESKTOP Fecha (already hidden md:block) */}
                    <div className="hidden md:block md:col-span-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                    </div>

                    {/* DESKTOP Estado */}
                    <div className="hidden md:flex md:col-span-2 items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                      <span className={`text-[10px] font-black uppercase tracking-wide ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* DESKTOP Total */}
                    <div className="hidden md:flex md:col-span-2 text-right items-center justify-end gap-2">
                      <span className="text-sm font-black text-foreground">
                        S/ {order.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                      {isExpanded
                        ? <ChevronUp size={14} className="text-muted-foreground shrink-0" />
                        : <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                      }
                    </div>

                    {/* MOBILE CTAs */}
                    <div className="flex flex-col gap-2 md:hidden cta-button w-full mt-2">
                      {isExpired ? (
                        <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500">
                          <XCircle size={13} />
                          Campaña Vencida
                        </div>
                      ) : (
                        <>
                          {order.status === 'PENDING_UPLOAD' && (
                            <Link
                              href={`/order-success/${order.id}`}
                              className={cn(
                                buttonVariants.default,
                                buttonSizes.lg,
                                "w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Upload size={13} />
                              Subir Contenido
                            </Link>
                          )}
                          {order.status === 'REJECTED' && (
                            <Link
                              href={`/order-success/${order.id}`}
                              className={cn(
                                buttonVariants.default,
                                buttonSizes.lg,
                                "w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AlertCircle size={13} />
                              Corregir Foto o Video
                            </Link>
                          )}
                          {order.evidence_urls && order.evidence_urls.length > 0 ? (
                            <Link
                              href={`/dashboard/orders/${order.id}/resumen`}
                              className={cn(
                                buttonVariants.default,
                                buttonSizes.lg,
                                "w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye size={13} />
                              Ver Reporte
                            </Link>
                          ) : (
                            (order.status === 'CONFIRMED' || order.status === 'VIDEO_SENT' || order.status === 'PENDING_VALIDATION') && (
                              <Link
                                href={`/order-success/${order.id}`}
                                className={cn(
                                  buttonVariants.default,
                                  buttonSizes.lg,
                                  "w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={13} />
                                Ver mi Anuncio
                              </Link>
                            )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

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

                        {/* Order Tracking Stepper or Expired Alert */}
                        {isExpired ? (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <AlertCircle size={14} /> Campaña Caducada
                            </p>
                            <p className="text-xs text-red-500/80">
                              Esta campaña ha vencido porque no llegó a completarse y activarse dentro de las fechas programadas.
                            </p>
                          </div>
                        ) : (
                          order.status !== 'CONFIRMED' && (
                            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                                Seguimiento de tu anuncio
                              </p>
                              <OrderTrackingStepper
                                status={order.status as OrderStatus}
                                layout="auto"
                              />
                            </div>
                          )
                        )}

                        {/* Bookings table */}
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3"></p>
                          <div className="space-y-2">
                            {order.bookings?.map((b: any) => {
                              const bookingEvidences = order.evidence_urls?.filter((url: string) => url.includes(`booking_${b.id}`)) || []
                              return (
                                <div key={b.id} className="rounded-lg bg-card border border-border overflow-hidden">
                                  <div className="grid grid-cols-3 gap-3 py-2.5 px-3 text-xs">
                                    <div className="flex items-center gap-2">
                                      <MapPin size={11} className="text-muted-foreground shrink-0" />
                                      <span className="font-bold text-foreground">{b.panels?.panel_code}</span>
                                    </div>
                                    <p className="text-muted-foreground truncate font-medium">{b.panels?.structures?.district}</p>
                                    <p className="text-right font-black text-foreground">S/ {b.amount?.toLocaleString()}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Actions row (HIDDEN ON MOBILE, shown in main row instead) */}
                        <div className="hidden md:flex flex-col sm:flex-row gap-2 pt-1 w-full">
                          {isExpired ? (
                            <div className="flex-grow sm:flex-grow-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500">
                              <XCircle size={13} />
                              Campaña Vencida
                            </div>
                          ) : (
                            <>
                              {order.status === 'PENDING_UPLOAD' && (
                                <Link
                                  href={`/order-success/${order.id}`}
                                  className={cn(
                                    buttonVariants.default,
                                    buttonSizes.lg,
                                    "w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                  )}
                                >
                                  <Upload size={13} />
                                  Subir Contenido
                                </Link>
                              )}
                              {order.status === 'REJECTED' && (
                                <Link
                                  href={`/order-success/${order.id}`}
                                  className={cn(
                                    buttonVariants.default,
                                    buttonSizes.lg,
                                    "w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                  )}
                                >
                                  <AlertCircle size={13} />
                                  Corregir Foto o Video
                                </Link>
                              )}
                              {order.evidence_urls && order.evidence_urls.length > 0 ? (
                                <Link
                                  href={`/dashboard/orders/${order.id}/resumen`}
                                  className={cn(
                                    buttonVariants.default,
                                    buttonSizes.lg,
                                    "w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                  )}
                                >
                                  <Eye size={13} />
                                  Ver Reporte
                                </Link>
                              ) : (
                                (order.status === 'CONFIRMED' || order.status === 'VIDEO_SENT' || order.status === 'PENDING_VALIDATION') && (
                                  <Link
                                    href={`/order-success/${order.id}`}
                                    className={cn(
                                      buttonVariants.default,
                                      buttonSizes.lg,
                                      "w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
                                    )}
                                  >
                                    <ExternalLink size={13} />
                                    Ver mi Anuncio
                                  </Link>
                                )
                              )}
                            </>
                          )}
                          <Link
                            href={`/dashboard/orders/${order.id}/nota`}
                            target="_blank"
                            onClick={e => e.stopPropagation()}
                            className={cn(
                              buttonVariants.secondary,
                              buttonSizes.lg,
                              "w-full sm:w-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                            )}
                          >
                            <FileText size={13} />
                            {order.profiles?.document_type === 'RUC' ? 'Ver factura' : 'Ver comprobante'}
                          </Link>
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

      {/* EVIDENCE PREVIEW DIALOG */}
      <Dialog
        isOpen={!!selectedEvidenceOrder}
        onClose={() => {
          setSelectedEvidenceOrder(null);
          setActivePreviewUrl(null);
        }}
        title="Evidencia de Instalación"
        description={`Imágenes de verificación para el pedido #${selectedEvidenceOrder?.id.slice(0, 8).toUpperCase()}`}
        className="max-w-2xl bg-card border border-border rounded-2xl  overflow-hidden"
        variant="default"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {selectedEvidenceOrder?.bookings?.map((b: any, idx: number) => {
              const bookingEvidences = selectedEvidenceOrder.evidence_urls?.filter((url: string) => url.includes(`booking_${b.id}`)) || [];
              return (
                <div key={b.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      <span className="font-mono text-sm font-bold text-foreground">
                        {b.panels?.panel_code || b.panel_id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
                        Panel {idx + 1}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      {b.panels?.structures?.district || '—'}
                    </span>
                  </div>

                  {bookingEvidences.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {bookingEvidences.map((url: string, imgIdx: number) => (
                        <div
                          key={imgIdx}
                          onClick={() => setActivePreviewUrl(url)}
                          className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted hover:border-primary transition-all cursor-pointer group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Evidencia Panel ${b.panels?.panel_code || b.panel_id.slice(0, 8)} - ${imgIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={16} className="text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground/60 italic p-2 bg-muted/40 rounded-lg">
                      Sin imágenes de evidencia para este panel.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-border/40">
            <Button
              onClick={() => {
                setSelectedEvidenceOrder(null);
                setActivePreviewUrl(null);
              }}
              className="font-bold text-xs uppercase tracking-wider px-5 py-2.5"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* FULLSCREEN LIGHTBOX PREVIEW */}
      <AnimatePresence>
        {activePreviewUrl && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <button
              onClick={() => setActivePreviewUrl(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[310] cursor-pointer"
              aria-label="Cerrar vista completa"
            >
              <X size={20} />
            </button>
            <div className="relative max-w-[95vw] max-h-[90vh] p-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePreviewUrl}
                alt="Evidencia Fullscreen"
                className="max-w-full max-h-[90vh] object-contain rounded-lg  animate-in zoom-in-95 duration-200"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
