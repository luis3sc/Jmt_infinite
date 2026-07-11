'use client'

import { useState, useRef } from 'react'
import { Search, CheckCircle2, XCircle, UploadCloud, Clock, Building2, Calendar, Download, FileText, Send, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { GestorOrderDetail, type Order } from './GestorOrderDetail'

const STATUS: Record<string, { label: string; color: string; dot: string }> = {
  PENDING_UPLOAD: { label: 'Sin video', color: 'text-muted-foreground', dot: 'bg-muted-foreground/30' },
  VIDEO_SENT: { label: 'Por revisar', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  PENDING_VALIDATION: { label: 'En validación', color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  APPROVED: { label: 'Aprobado', color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  SENT_TO_PROVIDER: { label: 'Enviado Prov.', color: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
  CONFIRMED: { label: 'Completado', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rechazado', color: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
}

const FILTERS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'VIDEO_SENT', label: 'Por revisar' },
  { value: 'PENDING_UPLOAD', label: 'Sin video' },
  { value: 'APPROVED', label: 'Aprobados' },
  { value: 'SENT_TO_PROVIDER', label: 'Enviados Prov.' },
  { value: 'CONFIRMED', label: 'Completados' },
  { value: 'REJECTED', label: 'Rechazados' },
]

export function GestorReviewList({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [filter, setFilter] = useState('VIDEO_SENT')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const tabsRef = useRef<HTMLDivElement>(null)

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 150
      tabsRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  }

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())
  const yyyy = parts.find(p => p.type === 'year')?.value
  const mm = parts.find(p => p.type === 'month')?.value
  const dd = parts.find(p => p.type === 'day')?.value
  const todayStr = `${yyyy}-${mm}-${dd}`

  const filtered = orders.filter(o => {
    // Client-side timezone-safe date filter
    if (o.bookings && o.bookings.length > 0) {
      const isExpired = !o.bookings.some(b => b.end_date >= todayStr)
      if (isExpired) return false
    }

    let matchFilter = false
    if (filter === 'ALL') {
      matchFilter = true
    } else if (filter === 'VIDEO_SENT') {
      matchFilter = o.status === 'VIDEO_SENT' || o.status === 'PENDING_VALIDATION'
    } else {
      matchFilter = o.status === filter
    }
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
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'APPROVED' } : o))
    setSelected(prev => prev?.id === orderId ? { ...prev, status: 'APPROVED' } : prev)
    showToast('✓ Video aprobado.', true)
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

  const handleMarkSent = async (orderId: string) => {
    const res = await fetch('/api/gestor/review-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action: 'MARK_SENT' }),
    })
    if (!res.ok) { showToast('Error al marcar como enviado.', false); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'SENT_TO_PROVIDER' } : o))
    setSelected(prev => prev?.id === orderId ? { ...prev, status: 'SENT_TO_PROVIDER' } : prev)
    showToast('✓ Campaña marcada como enviada al proveedor.', true)
  }

  const handleUploadEvidence = async (orderId: string, evidenceUrls: string[]) => {
    const res = await fetch('/api/gestor/review-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action: 'UPLOAD_EVIDENCE', evidenceUrls }),
    })
    if (!res.ok) { showToast('Error al subir evidencia.', false); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CONFIRMED', evidence_urls: evidenceUrls } : o))
    setSelected(prev => prev?.id === orderId ? { ...prev, status: 'CONFIRMED', evidence_urls: evidenceUrls } : prev)
    showToast('✓ Evidencia guardada y campaña completada.', true)
  }

  const handleDownloadVideo = async (videoUrl: string, orderId: string) => {
    if (!videoUrl) return
    try {
      setDownloadingId(orderId)
      const fileName = `jmt-campaña-${orderId.slice(0, 8)}.mp4`
      const downloadUrl = `/api/download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(fileName)}`

      const response = await fetch(downloadUrl)
      if (!response.ok) {
        showToast('El archivo de video no se encuentra disponible (404) o no se pudo descargar.', false)
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName

      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      showToast('✓ Descarga iniciada.', true)
    } catch (err) {
      console.error('Error downloading video:', err)
      showToast('Error de red al intentar descargar el video.', false)
    } finally {
      setDownloadingId(null)
    }
  }
  const actionButtons = (order: Order, isMobile: boolean = false) => {
    const isPending = order.status === 'VIDEO_SENT' || order.status === 'PENDING_VALIDATION'
    const buttonClass = isMobile
      ? "w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm py-2.5 rounded-xl h-auto"
      : "text-[9px] font-black uppercase tracking-widest h-7 px-3 rounded-lg shadow-sm"

    return (
      <>
        {order.status === 'PENDING_UPLOAD' && (
          <div className={cn("flex items-center gap-1.5 justify-center", isMobile ? "w-full py-2.5 border border-dashed border-border rounded-xl" : "")}>
            <UploadCloud size={14} className="text-muted-foreground/60" />
            <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">Sin Video</span>
          </div>
        )}
        {isPending && (
          <Button
            variant="default"
            size={isMobile ? "lg" : "sm"}
            onClick={() => setSelected(order)}
            className={cn(buttonClass, !isMobile && "shadow-primary/20")}
          >
            Revisar
          </Button>
        )}
        {order.status === 'APPROVED' && (
          <div className={cn("flex items-center gap-1.5", isMobile ? "w-full flex-col sm:flex-row" : "")}>
            {order.video_url && (
              <Button
                size={isMobile ? "lg" : "icon-xs"}
                variant="outline"
                title="Descargar Video"
                onClick={() => handleDownloadVideo(order.video_url!, order.id)}
                className={cn(
                  isMobile
                    ? "w-full flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] py-2.5 rounded-xl h-auto"
                    : "h-7 w-7 text-muted-foreground hover:text-foreground flex items-center justify-center border border-border bg-card rounded-md shrink-0 animate-in fade-in duration-200"
                )}
              >
                {downloadingId === order.id ? (
                  <span className="w-3 h-3 rounded-full border border-muted-foreground/40 border-t-muted-foreground animate-spin" />
                ) : (
                  <>
                    <Download size={12} />
                    {isMobile && "Descargar Video"}
                  </>
                )}
              </Button>
            )}
            <Button
              size={isMobile ? "lg" : "icon-xs"}
              variant="outline"
              title={order.profile?.document_type === 'RUC' ? 'Ver factura' : 'Ver comprobante'}
              onClick={() => window.open(`/dashboard/orders/${order.id}/nota`, '_blank')}
              className={cn(
                isMobile
                  ? "w-full flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] py-2.5 rounded-xl h-auto"
                  : "h-7 w-7 text-muted-foreground hover:text-foreground flex items-center justify-center border border-border bg-card rounded-md shrink-0"
              )}
            >
              <FileText size={12} />
              {isMobile && (order.profile?.document_type === 'RUC' ? 'Ver factura' : 'Ver comprobante')}
            </Button>
            <Button
              size={isMobile ? "lg" : "sm"}
              variant="secondary"
              onClick={() => handleMarkSent(order.id)}
              className={cn(
                buttonClass,
                isMobile ? "w-full" : "flex items-center gap-1"
              )}
            >
              <Send size={10} /> Enviar
            </Button>
          </div>
        )}
        {order.status === 'SENT_TO_PROVIDER' && (
          <Button
            variant="default"
            size={isMobile ? "lg" : "sm"}
            onClick={() => setSelected(order)}
            className={cn(
              buttonClass,
              isMobile ? "w-full" : "bg-upload hover:bg-upload-hover text-white flex items-center gap-1 border-transparent"
            )}
          >
            <UploadCloud size={11} /> Evidencia
          </Button>
        )}
        {order.status === 'CONFIRMED' && (
          <Button
            variant="outline"
            size={isMobile ? "lg" : "sm"}
            onClick={() => setSelected(order)}
            className={cn(
              buttonClass,
              isMobile ? "w-full" : "flex items-center gap-1"
            )}
          >
            <Eye size={11} /> Ver
          </Button>
        )}
        {order.status === 'REJECTED' && (
          <span className={cn(
            "text-[9px] font-black text-red-600 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg text-center",
            isMobile && "w-full text-center py-2 text-xs rounded-xl"
          )}>
            Rechazado
          </span>
        )}
      </>
    )
  }

  return (
    <div className="pb-24 relative space-y-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-6 right-6 z-[999] px-5 py-3 rounded-xl text-sm font-black  text-white ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-6">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por ID, cliente o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-background border-border py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-muted/5 h-auto rounded-md"
          />
        </div>

        {/* TABS */}
        <div className="relative border-b border-border/50 flex items-center">
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="md:hidden text-muted-foreground/50 hover:text-primary pr-2 py-2 focus:outline-none cursor-pointer z-10"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <div ref={tabsRef} className="flex-1 flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide scroll-smooth">
            {FILTERS.map(f => (
              <button
                type="button"
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "pb-3 text-xs md:text-sm font-medium whitespace-nowrap transition-colors relative cursor-pointer",
                  filter === f.value ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
              >
                {f.label}
                {filter === f.value && (
                  <motion.div
                    layoutId="activeTabGestor"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="md:hidden text-muted-foreground/50 hover:text-primary pl-2 py-2 focus:outline-none cursor-pointer z-10"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* TABLE HEADER — desktop only */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-border/50">
        <p className="col-span-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">#</p>
        <p className="col-span-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cliente</p>
        <p className="col-span-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estado</p>
        <p className="col-span-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Acciones</p>
      </div>

      {/* ROWS */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((order, i) => {
              const st = STATUS[order.status] ?? { label: order.status, color: 'text-muted-foreground', dot: 'bg-muted-foreground/40' }
              const isPending = order.status === 'VIDEO_SENT' || order.status === 'PENDING_VALIDATION'

              const dateText = (() => {
                if (!order.bookings || order.bookings.length === 0) {
                  return new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).toUpperCase()
                }
                const starts = order.bookings.map(b => b.start_date).filter(Boolean).sort()
                const ends = order.bookings.map(b => b.end_date).filter(Boolean).sort()
                if (starts.length === 0 || ends.length === 0) {
                  return new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).toUpperCase()
                }
                const fmtDate = (dStr: string) => {
                  const d = new Date(dStr + 'T00:00:00')
                  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '')
                }
                return `${fmtDate(starts[0])} - ${fmtDate(ends[ends.length - 1])}`
              })()

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
                    onClick={() => setSelected(order)}
                  >
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-4 py-4 md:items-center">

                      {/* MOBILE TOP ROW: Client & Status */}
                      <div className="flex justify-between items-start md:hidden mb-1">
                        <div className="flex flex-col min-w-0">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Cliente</p>
                          <p className="text-xs font-bold text-foreground truncate">
                            {order.profile?.full_name || order.profile?.email || 'Sin nombre'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot} ${isPending ? 'animate-pulse' : ''}`} />
                          <span className={`text-[10px] font-black uppercase tracking-wide ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                      </div>

                      {/* MOBILE DETAILS ROW */}
                      <div className="flex justify-between items-center md:hidden mb-2">
                        <div className="flex flex-col">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Fecha</p>
                          <p className="text-xs text-muted-foreground font-semibold">
                            {dateText}
                          </p>
                        </div>
                      </div>

                      {/* DESKTOP Index */}
                      <div className="hidden md:block md:col-span-1">
                        <span className="font-mono text-[10px] text-muted-foreground/60">{i + 1}</span>
                      </div>

                      {/* DESKTOP Client */}
                      <div className="hidden md:flex md:col-span-4 flex-col justify-center gap-0.5">
                        <p className="text-xs font-bold text-foreground truncate">
                          {order.profile?.full_name || order.profile?.email || 'Sin nombre'}
                        </p>
                        {order.profile?.company_name && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                            <Building2 size={9} /> {order.profile.company_name}
                          </p>
                        )}
                        <p className="text-[10px] font-mono text-muted-foreground/50">#{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>

                      {/* DESKTOP Date */}
                      <div className="hidden md:block md:col-span-3">
                        <p className="text-xs text-muted-foreground font-medium">
                          {dateText}
                        </p>
                      </div>

                      {/* DESKTOP Status */}
                      <div className="hidden md:flex md:col-span-2 items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot} ${isPending ? 'animate-pulse' : ''}`} />
                        <span className={`text-[10px] font-black uppercase tracking-wide ${st.color}`}>
                          {st.label}
                        </span>
                      </div>

                      {/* DESKTOP Actions */}
                      <div className="hidden md:flex md:col-span-2 items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {actionButtons(order)}
                      </div>

                      {/* MOBILE CTAs */}
                      <div className="flex flex-col gap-2 md:hidden cta-button w-full mt-2" onClick={e => e.stopPropagation()}>
                        {actionButtons(order, true)}
                      </div>

                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : (
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

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <GestorOrderDetail
            key={selected.id}
            order={selected}
            onClose={() => setSelected(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onMarkSent={handleMarkSent}
            onUploadEvidence={handleUploadEvidence}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
