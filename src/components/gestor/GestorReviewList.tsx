'use client'

import { useState } from 'react'
import { Search, CheckCircle2, XCircle, UploadCloud, Clock, Building2, Calendar, Download, FileText, Send, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
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

  return (
    <div className="pb-24 relative">

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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por ID, cliente o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/50 shadow-sm h-auto"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTERS.map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              onClick={() => setFilter(f.value)}
              className="px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap h-auto shadow-sm"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-xl bg-card shadow-sm">
          <Search size={28} className="text-muted-foreground/40 mx-auto mb-4" strokeWidth={1} />
          <p className="text-sm font-black text-foreground uppercase tracking-tight mb-1">Sin resultados</p>
          <Button
            variant="link"
            onClick={() => { setSearch(''); setFilter('ALL') }}
            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline mt-2 p-0 h-auto"
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-muted/30 border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Cliente</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          {filtered.map((order, i) => {
            const st = STATUS[order.status] ?? { label: order.status, color: 'text-muted-foreground', dot: 'bg-muted-foreground/40' }
            const isPending = order.status === 'VIDEO_SENT' || order.status === 'PENDING_VALIDATION'

            return (
              <div
                key={order.id}
                onClick={() => setSelected(order)}
                className={`w-full text-left grid grid-cols-2 md:grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-b-0 rounded-none h-auto transition-all cursor-pointer ${isPending ? 'bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10 dark:hover:bg-amber-500/20' : 'hover:bg-muted/40'} group`}
              >
                <div className="col-span-1 hidden md:flex items-center">
                  <span className="font-mono text-[10px] text-muted-foreground/60">{i + 1}</span>
                </div>

                <div className="col-span-2 md:col-span-5 flex flex-col justify-center gap-0.5">
                  <p className="text-sm font-bold text-foreground truncate">
                    {order.profile?.full_name || order.profile?.email || 'Sin nombre'}
                  </p>
                  {order.profile?.company_name && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Building2 size={9} /> {order.profile.company_name}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-muted-foreground/50">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>

                <div className="hidden md:flex md:col-span-2 flex-col justify-center gap-0.5 text-xs text-muted-foreground">
                  {(() => {
                    if (!order.bookings || order.bookings.length === 0) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={11} className="text-primary/40" />
                          <span>{new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      )
                    }
                    const starts = order.bookings.map(b => b.start_date).filter(Boolean).sort()
                    const ends = order.bookings.map(b => b.end_date).filter(Boolean).sort()
                    if (starts.length === 0 || ends.length === 0) {
                      return (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={11} className="text-primary/40" />
                          <span>{new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      )
                    }
                    const fmtDate = (dStr: string) => {
                      const d = new Date(dStr + 'T00:00:00')
                      return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '')
                    }
                    return (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Vigencia</span>
                        </div>
                        <div className="font-semibold text-foreground text-[10px] whitespace-nowrap">
                          {fmtDate(starts[0])} - {fmtDate(ends[ends.length - 1])}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot} ${isPending ? 'animate-pulse' : ''}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wide ${st.color}`}>{st.label}</span>
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                  {order.status === 'PENDING_UPLOAD' && (
                    <UploadCloud size={14} className="text-muted-foreground/60 mr-2" />
                  )}
                  {isPending && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSelected(order)}
                      className="text-[9px] font-black uppercase tracking-widest h-7 px-3 rounded-lg shadow-sm shadow-primary/20"
                    >
                      Revisar
                    </Button>
                  )}
                  {order.status === 'APPROVED' && (
                    <div className="flex items-center gap-1">
                      {order.video_url && (
                        <Button
                          size="icon-xs"
                          variant="outline"
                          title="Descargar Video"
                          onClick={() => handleDownloadVideo(order.video_url!, order.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground flex items-center justify-center border border-border bg-card rounded-md"
                        >
                          {downloadingId === order.id ? (
                            <span className="w-3 h-3 rounded-full border border-muted-foreground/40 border-t-muted-foreground animate-spin" />
                          ) : (
                            <Download size={12} />
                          )}
                        </Button>
                      )}
                      <Button
                        size="icon-xs"
                        variant="outline"
                        title={order.profile?.document_type === 'RUC' ? 'Ver factura' : 'Ver comprobante'}
                        onClick={() => window.open(`/dashboard/orders/${order.id}/nota`, '_blank')}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground flex items-center justify-center border border-border bg-card rounded-md"
                      >
                        <FileText size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMarkSent(order.id)}
                        className="text-[9px] font-black uppercase tracking-widest h-7 px-3 rounded-lg shadow-sm flex items-center gap-1"
                      >
                        <Send size={10} /> Enviar
                      </Button>
                    </div>
                  )}
                  {order.status === 'SENT_TO_PROVIDER' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSelected(order)}
                      className="text-[9px] font-black uppercase tracking-widest h-7 px-3 bg-upload hover:bg-upload-hover text-white rounded-lg shadow-sm flex items-center gap-1 border-transparent"
                    >
                      <UploadCloud size={11} /> Evidencia
                    </Button>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(order)}
                      className="text-[9px] font-black uppercase tracking-widest h-7 px-3 rounded-lg flex items-center gap-1"
                    >
                      <Eye size={11} /> Ver
                    </Button>
                  )}
                  {order.status === 'REJECTED' && (
                    <span className="text-[9px] font-black text-red-600 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                      Rechazado
                    </span>
                  )}
                </div>
              </div>
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
            onMarkSent={handleMarkSent}
            onUploadEvidence={handleUploadEvidence}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
