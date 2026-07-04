'use client'

import {
  X, CheckCircle2, XCircle, Play, Calendar, User, Building2,
  Mail, Phone, UploadCloud, ExternalLink, Download,
  MapPin, Monitor, Ruler, AlertTriangle, Loader2, FileText, Eye, Send
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Panel {
  id: string; panel_code: string; face: string | null; media_type: string | null
  format: string | null; width: number | null; height: number | null
  resolution_width: number | null; resolution_height: number | null
  traffic_view: string | null
  slot_duration_seconds: number | null
  structures: { code: string | null; address: string | null; reference: string | null; district: string | null; city: string | null; latitude: number | null; longitude: number | null } | null
}

interface Booking {
  id: string; start_date: string; end_date: string; amount: number
  campaign_name: string; panel_id: string; panels: Panel | null
}

export interface Order {
  id: string; status: string; video_url: string | null
  total_amount: number | null; rejection_reason: string | null
  evidence_urls?: string[] | null
  created_at: string; user_id: string
  bookings: Booking[]
  profile: { id: string; full_name: string | null; email: string | null; company_name: string | null; phone: string | null; document_type?: string | null; receipt_type?: string | null } | null
}

interface Props {
  order: Order
  onClose: () => void
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
  onMarkSent: (id: string) => Promise<void>
  onUploadEvidence: (id: string, evidenceUrls: string[]) => Promise<void>
}

const fmt = (d: string) => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

export function GestorOrderDetail({ order, onClose, onApprove, onReject, onMarkSent, onUploadEvidence }: Props) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | 'download' | 'mark_sent' | 'upload_evidence' | null>(null)

  // Dynamic video metadata analyzer
  const [videoMeta, setVideoMeta] = useState<{ width: number; height: number; duration: number } | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)

  // Drag-and-drop state for multiple evidence photos per booking
  const [evidenceFiles, setEvidenceFiles] = useState<Record<string, File[]>>({})
  const [evidencePreviews, setEvidencePreviews] = useState<Record<string, string[]>>({})

  const handleFilesChange = (bookingId: string, files: File[], previews: string[]) => {
    setEvidenceFiles(prev => ({ ...prev, [bookingId]: files }))
    setEvidencePreviews(prev => ({ ...prev, [bookingId]: previews }))
  }

  const isPending = order.status === 'VIDEO_SENT' || order.status === 'PENDING_VALIDATION'
  const isApproved = order.status === 'APPROVED'
  const isSentToProvider = order.status === 'SENT_TO_PROVIDER'
  const isConfirmed = order.status === 'CONFIRMED'
  const isRejected = order.status === 'REJECTED'

  const handleApprove = async () => {
    setLoading('approve')
    await onApprove(order.id)
    setLoading(null)
  }

  const handleReject = async () => {
    setLoading('reject')
    await onReject(order.id, reason)
    setLoading(null)
    setRejectOpen(false)
    setReason('')
  }

  const handleMarkSent = async () => {
    setLoading('mark_sent')
    await onMarkSent(order.id)
    setLoading(null)
  }

  const handleUploadEvidence = async () => {
    const totalFilesCount = Object.values(evidenceFiles).reduce((sum, files) => sum + files.length, 0)
    if (totalFilesCount === 0) return

    // Check if every booking has at least 1 file
    const missingBookings = order.bookings.filter(b => !evidenceFiles[b.id] || evidenceFiles[b.id].length === 0)
    if (missingBookings.length > 0) {
      alert(`Por favor, sube evidencia para todos los paneles. Falta: ${missingBookings.map(b => b.panels?.panel_code || b.panel_id.slice(0, 8)).join(', ')}`)
      return
    }

    setLoading('upload_evidence')
    try {
      const publicUrls: string[] = []
      const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') || 'https://pub-5718acf26ed541c08ba6bc9fe7255402.r2.dev'

      for (const booking of order.bookings) {
        const filesForBooking = evidenceFiles[booking.id] || []
        for (const file of filesForBooking) {
          // Prefix filename with booking ID to match later
          const prefixedName = `booking_${booking.id}_${file.name}`

          const res = await fetch('/api/upload-video/presigned-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              fileName: prefixedName,
              fileType: file.type || 'image/jpeg',
              category: 'evidence'
            })
          })
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            throw new Error(errData.error || `HTTP ${res.status}`)
          }
          const { uploadUrl, key } = await res.json()

          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type || 'image/jpeg' }
          })
          if (!uploadRes.ok) throw new Error('Error al subir a R2')

          publicUrls.push(`${publicBase}/${key}`)
        }
      }

      await onUploadEvidence(order.id, publicUrls)

      // Revoke urls
      Object.values(evidencePreviews).forEach(previews => {
        previews.forEach(url => URL.revokeObjectURL(url))
      })
      setEvidenceFiles({})
      setEvidencePreviews({})
    } catch (err: any) {
      console.error(err)
      alert(`Ocurrió un error al subir la evidencia: ${err.message || err}`)
    } finally {
      setLoading(null)
    }
  }

  const handleDownload = async () => {
    if (!order.video_url) return
    try {
      setLoading('download')
      const fileName = `jmt-campaña-${order.id.slice(0, 8)}.mp4`
      const downloadUrl = `/api/download?url=${encodeURIComponent(order.video_url)}&filename=${encodeURIComponent(fileName)}`

      const response = await fetch(downloadUrl)
      if (!response.ok) {
        alert('El archivo de video no se encuentra disponible (404) o no se pudo descargar.')
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

    } catch (err) {
      console.error('Error downloading video:', err)
      alert('Error de red al intentar descargar el video.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="detail-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      />

      <motion.div
        key="detail-modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed inset-0 z-[210] flex items-center justify-center p-0 sm:p-4 pointer-events-none"
      >
        <div
          className={cn(
            "pointer-events-auto w-full bg-background border-0 sm:border border-border rounded-none sm:rounded-2xl  flex flex-col overflow-hidden text-foreground",
            isRejected
              ? "sm:max-w-[600px] h-full sm:h-auto sm:max-h-[90vh]"
              : "sm:max-w-[90vw] h-full sm:h-[90vh]"
          )}
          onClick={e => e.stopPropagation()}
        >
          {/* ── TOP HEADER (static) ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Revisión de campaña</p>
                <p className="text-sm font-black text-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Status badges */}
              {isApproved && <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">✓ Aprobado</span>}
              {isSentToProvider && <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> Enviado Prov.</span>}
              {isConfirmed && <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">✓ Completado</span>}
              {isRejected && <span className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">✗ Rechazado</span>}
              {isPending && <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Por revisar</span>}
              {order.status === 'PENDING_UPLOAD' && <span className="px-3 py-1 rounded-lg bg-muted border border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sin video</span>}
              <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:bg-muted">
                <X size={18} />
              </Button>
            </div>
          </div>

          {/* ── MAIN BODY ── */}
          {isApproved ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
              <div className="max-w-md w-full space-y-6">
                <div className="text-center space-y-2">
                  <CheckCircle2 size={48} className="mx-auto text-primary mb-4" />
                  <h3 className="text-xl font-black uppercase tracking-tight">Video Aprobado</h3>
                  <p className="text-sm text-muted-foreground">Descarga los archivos necesarios o marca la orden como enviada al proveedor.</p>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleDownload}
                    disabled={loading === 'download'}
                    className="w-full flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[11px]"
                  >
                    {loading === 'download' && <Spin />}
                    Descargar Video
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => window.open(`/dashboard/orders/${order.id}/nota`, '_blank')}
                    className="w-full flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[11px]"
                  >
                    {order.profile?.document_type === 'RUC' ? 'Ver factura' : 'Ver comprobante'}
                  </Button>

                  <div className="pt-4 border-t border-border mt-4">
                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleMarkSent}
                      disabled={!!loading}
                      className="w-full flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[11px]"
                    >
                      {loading === 'mark_sent' && <Spin />}
                      Marcar enviado a proveedor
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : isSentToProvider ? (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 bg-background">
              {/* MAIN SCROLL AREA (Left side on desktop, Full scroll area on mobile) */}
              <div className="flex-1 flex flex-col border-r border-border min-h-0 overflow-y-auto custom-scrollbar">

                {/* MOBILE ONLY: Header and Instructions */}
                <div className="lg:hidden p-6 pb-0 flex flex-col justify-center space-y-4">
                  <div className="text-center space-y-2">
                    <UploadCloud size={40} className="mx-auto text-primary mb-2" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Carga de Evidencia Fotográfica</h3>
                    <p className="text-xs text-muted-foreground">Sube las fotografías que comprueban que la campaña está activa para cada panel asignado.</p>
                  </div>
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Instrucciones
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Es obligatorio subir al menos una foto de evidencia para cada panel. El botón para guardar se habilitará una vez que todos los paneles tengan evidencia cargada.
                    </p>
                  </div>
                </div>

                {/* PANELS LIST */}
                <div className="p-6 lg:p-8 space-y-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden lg:block mb-4">Paneles asignados y carga</p>
                  <div className="space-y-6">
                    {order.bookings?.map((b, i) => {
                      const files = evidenceFiles[b.id] || []
                      const previews = evidencePreviews[b.id] || []
                      const hasFiles = files.length > 0

                      return (
                        <div key={b.id} className="rounded-xl bg-card border border-border p-5 space-y-4 shadow-sm relative overflow-hidden">
                          {/* Indicator bar */}
                          <div className={`absolute top-0 left-0 right-0 h-1 ${hasFiles ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Panel {order.bookings.length > 1 ? i + 1 : ''}</span>
                              <h4 className="text-sm font-black text-foreground mt-0.5 flex items-center gap-1.5">
                                <Monitor size={15} className="text-primary" />
                                {b.panels?.panel_code || b.panel_id.slice(0, 8)}
                              </h4>
                            </div>

                            {hasFiles ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                ✓ Foto cargada ({files.length})
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                                <AlertTriangle size={10} /> Requiere foto
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-[11px] text-muted-foreground py-2 border-y border-border/50">
                            <div>
                              <span className="font-semibold block text-[9px] uppercase tracking-wider text-slate-500/60 mb-0.5">Ubicación</span>
                              <span className="text-foreground font-bold">{b.panels?.structures?.district || '—'}</span>
                              <span className="block truncate text-muted-foreground/80">{b.panels?.structures?.address || '—'}</span>
                            </div>
                            <div>
                              <span className="font-semibold block text-[9px] uppercase tracking-wider text-slate-500/60 mb-0.5">Período</span>
                              <span className="text-foreground font-bold flex items-center gap-1"><Calendar size={10} /> {fmt(b.start_date)} → {fmt(b.end_date)}</span>
                            </div>
                          </div>

                          <PanelUploadZone
                            bookingId={b.id}
                            files={files}
                            previews={previews}
                            onFilesChange={(newFiles, newPreviews) => handleFilesChange(b.id, newFiles, newPreviews)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* SIDEBAR ON DESKTOP / FIXED FOOTER ON MOBILE */}
              <div className="w-full lg:w-[40%] flex flex-col shrink-0 min-h-0 bg-muted/10">
                {/* DESKTOP ONLY: Header and Instructions */}
                <div className="hidden lg:flex flex-1 overflow-y-auto p-8 flex-col justify-center space-y-6">
                  <div className="text-center space-y-2">
                    <UploadCloud size={48} className="mx-auto text-primary mb-4" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Carga de Evidencia Fotográfica</h3>
                    <p className="text-sm text-muted-foreground">Sube las fotografías que comprueban que la campaña está activa para cada panel asignado.</p>
                  </div>

                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-5 space-y-2">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Instrucciones
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Es obligatorio subir al menos una foto de evidencia para cada panel. El botón para guardar se habilitará una vez que todos los paneles tengan evidencia cargada.
                    </p>
                  </div>
                </div>

                {/* Footer with Progress and Action (Always visible at bottom) */}
                <div className="p-4 sm:p-6 lg:p-8 border-t border-border bg-background mt-auto shrink-0 z-10 w-full shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)] lg:shadow-none">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="text-[11px] sm:text-sm text-muted-foreground font-semibold text-center">
                      {(() => {
                        const uploadedCount = Object.values(evidenceFiles).filter(files => files.length > 0).length
                        const totalCount = order.bookings.length
                        return (
                          <span>Progreso: <strong className="text-foreground">{uploadedCount} de {totalCount}</strong> paneles listos</span>
                        )
                      })()}
                    </div>

                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleUploadEvidence}
                      disabled={!!loading || !order.bookings.every(b => (evidenceFiles[b.id]?.length ?? 0) > 0)}
                      className="w-full font-black uppercase tracking-widest text-[10px] sm:text-[11px] flex items-center justify-center gap-2 shadow-lg h-auto px-4 sm:px-8 py-3.5 sm:py-4 animate-in fade-in duration-200"
                    >
                      {loading === 'upload_evidence' && <Spin />}
                      Guardar Evidencias
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">

              {/* LEFT — Video / Screen preview */}
              {!isRejected && (
                <div className="lg:w-[55%] flex flex-col bg-muted/30 border-r border-border shrink-0">
                  {order.video_url ? (
                    <>
                      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                        <video
                          controls
                          onLoadedMetadata={(e) => {
                            const vid = e.currentTarget
                            setVideoMeta({
                              width: vid.videoWidth,
                              height: vid.videoHeight,
                              duration: Math.round(vid.duration)
                            })
                            setVideoError(null)
                          }}
                          onError={() => {
                            setVideoError('Error al cargar video (404 / no encontrado en R2)')
                          }}
                          className="max-w-full max-h-full rounded-xl border border-border bg-black object-contain shadow-sm"
                          src={order.video_url}
                        >Tu navegador no soporta video.</video>
                      </div>
                      {/* Video actions */}
                      {!isPending && (
                        <div className="flex items-center gap-3 px-5 py-4 border-t border-border shrink-0 bg-card">
                          <Button
                            variant="outline"
                            onClick={handleDownload}
                            disabled={loading === 'download'}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest h-auto shadow-sm"
                          >
                            {loading === 'download' && <Spin />}
                            Descargar Video
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => window.open(`/dashboard/orders/${order.id}/nota`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest h-auto shadow-sm"
                          >
                            {order.profile?.document_type === 'RUC' ? 'Ver factura' : 'Ver comprobante'}
                          </Button>

                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                      <UploadCloud size={40} className="text-muted-foreground" strokeWidth={1} />
                      <p className="text-sm font-bold text-muted-foreground">Sin video todavía</p>
                      <p className="text-xs text-muted-foreground/80">El cliente aún no ha subido su material de campaña.</p>
                    </div>
                  )}
                </div>
              )}

              {/* RIGHT — Scrollable details & Action board */}
              <div className={cn("flex flex-col bg-background min-h-0", isRejected ? "w-full flex-1" : "lg:w-[45%]")}>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                  {/* Rejected reason */}
                  {isRejected && order.rejection_reason && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
                      <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Motivo de rechazo</p>
                      <p className="text-sm text-foreground font-medium">{order.rejection_reason}</p>
                    </div>
                  )}

                  {/* Client contact details */}
                  <section>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Datos del cliente</p>
                    <div className="rounded-xl bg-muted/30 border border-border divide-y divide-border/60">
                      <Row icon={<User size={13} />} label="Nombre" value={order.profile?.full_name || '—'} />
                      {order.profile?.company_name && <Row icon={<Building2 size={13} />} label="Empresa" value={order.profile.company_name} />}
                      <Row
                        icon={<Mail size={13} />} label="Correo"
                        value={<a href={`mailto:${order.profile?.email}`} className="text-primary hover:underline">{order.profile?.email || '—'}</a>}
                      />
                      <Row
                        icon={<Phone size={13} />} label="Teléfono"
                        value={order.profile?.phone
                          ? <a href={`tel:${order.profile.phone}`} className="text-primary hover:underline">{order.profile.phone}</a>
                          : <span className="text-muted-foreground">Sin teléfono</span>
                        }
                      />
                    </div>
                  </section>

                  {/* Bookings / Panel details */}
                  {order.bookings?.map((b, i) => (
                    <section key={b.id}>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Monitor size={11} className="text-primary" /> Pantalla {order.bookings.length > 1 ? i + 1 : ''}
                      </p>
                      <div className="rounded-xl bg-muted/30 border border-border divide-y divide-border/60">
                        <Row icon={<span className="text-[10px] font-mono">#</span>} label="Código panel" value={b.panels?.panel_code || b.panel_id.slice(0, 8)} />
                        <Row icon={<Calendar size={13} />} label="Período"
                          value={`${fmt(b.start_date)} → ${fmt(b.end_date)}`}
                        />
                      </div>

                      {/* Structure location */}
                      {b.panels?.structures && (
                        <div className="mt-2 rounded-xl bg-muted/30 border border-border divide-y divide-border/60">
                          {b.panels.structures.latitude && (
                            <Row
                              icon={<MapPin size={13} />} label="Coordenadas"
                              value={
                                <a
                                  href={`https://maps.google.com/?q=${b.panels.structures.latitude},${b.panels.structures.longitude}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-primary hover:underline text-xs"
                                >
                                  {b.panels.structures.latitude.toFixed(5)}, {b.panels.structures.longitude?.toFixed(5)}
                                </a>
                              }
                            />
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-2 px-1 pb-2 border-b border-border/50">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Monto</span>
                        <span className="text-sm font-black text-primary">S/ {Number(b.amount).toLocaleString('es-PE')}</span>
                      </div>

                      {/* Panel-specific Evidence Display */}
                      {isConfirmed && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Foto de Evidencia</p>
                          {(() => {
                            const bookingEvidences = order.evidence_urls?.filter(url => url.includes(`booking_${b.id}`)) || []
                            if (bookingEvidences.length > 0) {
                              return (
                                <div className="grid grid-cols-2 gap-2">
                                  {bookingEvidences.map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted hover:border-primary transition-all group"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt={`Evidencia Panel ${b.panels?.panel_code || b.panel_id.slice(0, 8)} - ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ExternalLink size={14} className="text-white" />
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              )
                            }
                            return (
                              <div className="text-[10px] text-muted-foreground/60 italic">Sin imágenes de evidencia para este panel.</div>
                            )
                          })()}
                        </div>
                      )}
                    </section>
                  ))}

                  {/* Total */}
                  <div className="flex items-center justify-between py-4 border-t border-border mt-auto">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total orden</span>
                    <span className="text-2xl font-black text-foreground">S/ {Number(order.total_amount).toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>

                {/* ── STATIC ACTION BAR (DIFERENCIADA POR ESTADO) ── */}
                {isPending && order.video_url && (
                  <div className="px-4 sm:px-5 py-4 sm:py-5 border-t border-border bg-card shrink-0 flex flex-row gap-3 sm:gap-4 sticky bottom-0 z-10">
                    <Button
                      onClick={handleApprove}
                      disabled={!!loading}
                      variant="default"
                      size="lg"
                      className="flex-grow sm:flex-1 font-black uppercase tracking-widest text-[11px] shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>Aprobar Video</span>
                    </Button>
                    <Button
                      onClick={() => setRejectOpen(true)}
                      disabled={!!loading}
                      variant="destructive"
                      size="lg"
                      className=" sm:px-fluid-lg  font-black uppercase tracking-widest text-[11px] shadow-sm flex items-center justify-center gap-2 shrink-0"
                    >
                      <span className="sm:inline">Rechazar</span>
                    </Button>
                  </div>
                )}

                {isConfirmed && (
                  <div className="px-5 py-4 border-t border-border bg-muted/30 shrink-0 text-center">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={14} /> Campaña completada y activa
                    </p>
                  </div>
                )}

                {isRejected && (
                  <div className="px-5 py-4 border-t border-border bg-muted/30 shrink-0 text-center">
                    <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <XCircle size={14} /> Esperando que el cliente re-suba el material
                    </p>
                  </div>
                )}

                {order.status === 'PENDING_UPLOAD' && (
                  <div className="px-5 py-4 border-t border-border bg-muted/30 shrink-0 text-center">
                    <p className="text-xs text-muted-foreground">Campaña pendiente de material del cliente.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── REJECT MODAL ── */}
      {rejectOpen && (
        <div key="reject-modal-container">
          <motion.div
            key="reject-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]"
            onClick={() => setRejectOpen(false)}
          />
          <motion.div
            key="reject-content"
            initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[310] w-full max-w-md bg-background border border-border rounded-2xl p-8  text-foreground"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500 dark:text-red-400"><AlertTriangle size={20} /></div>
              <div>
                <h3 className="font-black text-foreground uppercase tracking-tight">Rechazar Video</h3>
                <p className="text-xs text-muted-foreground">Orden #{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Indica el motivo para que el cliente pueda corregir su material.</p>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: El video no cumple con las dimensiones requeridas (16:9)..."
              rows={4}
              className="w-full bg-muted/30 border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-red-500/40 resize-none mb-5 focus-visible:bg-card/50 transition-colors"
            />
            <div className="flex gap-3">
              <Button onClick={() => setRejectOpen(false)} variant="outline" className="flex-1 py-3 rounded-xl bg-card border border-border text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-muted hover:text-foreground transition-all shadow-sm">Cancelar</Button>
              <Button
                onClick={handleReject}
                disabled={!!loading}
                variant="destructive"
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading === 'reject' && <Spin />} Confirmar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ── helpers ──
function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
        <div className="text-sm font-bold text-foreground break-words">{value}</div>
      </div>
    </div>
  )
}
function Spin() {
  return <span className="w-4 h-4 rounded-full border-2 border-current/40 border-t-current animate-spin" />
}

interface PanelUploadZoneProps {
  bookingId: string
  files: File[]
  previews: string[]
  onFilesChange: (files: File[], previews: string[]) => void
}

function PanelUploadZone({ bookingId, files, previews, onFilesChange }: PanelUploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    onDrop: (acceptedFiles) => {
      const newFiles = [...files, ...acceptedFiles]
      const newPreviews = [...previews, ...acceptedFiles.map(file => URL.createObjectURL(file))]
      onFilesChange(newFiles, newPreviews)
    }
  })

  const handleRemove = (index: number) => {
    URL.revokeObjectURL(previews[index])
    const newFiles = files.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    onFilesChange(newFiles, newPreviews)
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-muted/30 ${isDragActive ? 'border-primary bg-primary/5' : ''
          }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto text-muted-foreground/60 mb-2" size={24} />
        <p className="text-xs font-bold text-foreground">Arrastra imágenes de la evidencia o haz click</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Soporta JPG, PNG · Múltiples fotos permitidas</p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {previews.map((url, idx) => (
            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Vista previa ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
