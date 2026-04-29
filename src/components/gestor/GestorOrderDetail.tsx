'use client'

import {
  X, CheckCircle2, XCircle, Play, Calendar, User, Building2,
  Mail, Phone, UploadCloud, ExternalLink, Download, Share2,
  MapPin, Monitor, Ruler, AlertTriangle, Clapperboard, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface Panel {
  id: string; panel_code: string; face: string | null; media_type: string | null
  format: string | null; width: number | null; height: number | null
  resolution_width: number | null; resolution_height: number | null
  traffic_view: string | null
  structures: { code: string | null; address: string | null; reference: string | null; district: string | null; city: string | null; latitude: number | null; longitude: number | null } | null
}

interface Booking {
  id: string; start_date: string; end_date: string; amount: number
  campaign_name: string; panel_id: string; panels: Panel | null
}

export interface Order {
  id: string; status: string; video_url: string | null
  total_amount: number | null; rejection_reason: string | null
  created_at: string; user_id: string
  bookings: Booking[]
  profile: { id: string; full_name: string | null; email: string | null; company_name: string | null; phone: string | null } | null
}

interface Props {
  order: Order
  onClose: () => void
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
}

const fmt = (d: string) => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

export function GestorOrderDetail({ order, onClose, onApprove, onReject }: Props) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | 'download' | null>(null)

  const isPending = order.status === 'VIDEO_SENT' || order.status === 'PENDING_VALIDATION'
  const isApproved = order.status === 'CONFIRMED'
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

  const handleShare = async () => {
    if (!order.video_url) return
    if (navigator.share) {
      try {
        await navigator.share({ title: `Video campaña #${order.id.slice(0, 8)}`, url: order.video_url })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      await navigator.clipboard.writeText(order.video_url)
      alert('Enlace copiado al portapapeles')
    }
  }

  const handleDownload = async () => {
    if (!order.video_url) return
    try {
      setLoading('download')
      const fileName = `jmt-campaña-${order.id.slice(0, 8)}.mp4`
      const downloadUrl = `/api/download?url=${encodeURIComponent(order.video_url)}&filename=${encodeURIComponent(fileName)}`
      
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error('Network response was not ok')
      
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
      const link = document.createElement('a')
      link.href = order.video_url
      link.target = '_blank'
      link.download = `jmt-video-${order.id.slice(0, 8)}.mp4`
      link.click()
    } finally {
      setLoading(null)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="detail-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-0 sm:p-4"
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
          className="pointer-events-auto w-full max-w-full sm:max-w-[90vw] h-full sm:h-[90vh] bg-[#0c1427] border-0 sm:border border-white/10 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* ── TOP HEADER (static) ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revisión de campaña</p>
                <p className="text-sm font-black text-white">#{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Status badge */}
              {isApproved && <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">✓ Aprobado — En curso</span>}
              {isRejected && <span className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-400 uppercase tracking-widest">✗ Rechazado</span>}
              {isPending && <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Por revisar</span>}
              {order.status === 'PENDING_UPLOAD' && <span className="px-3 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin video</span>}
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"><X size={18} /></button>
            </div>
          </div>

          {/* ── MAIN BODY ── */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">

            {/* LEFT — Video (static, no scroll) */}
            <div className="lg:w-[55%] flex flex-col bg-black/40 shrink-0">
              {order.video_url ? (
                <>
                  <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                    <video
                      controls
                      className="max-w-full max-h-full rounded-xl border border-white/10 object-contain"
                      src={order.video_url}
                    >Tu navegador no soporta video.</video>
                  </div>
                  {/* Video actions */}
                  <div className="flex items-center gap-3 px-5 py-4 border-t border-white/5 shrink-0">

                    <button
                      onClick={handleDownload}
                      disabled={loading === 'download'}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/[0.08] transition-all disabled:opacity-50"
                    >
                      {loading === 'download' ? <Spin /> : <Download size={13} />} 
                      Descargar
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all"
                    >
                      <Share2 size={13} /> Compartir enlace
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                  <UploadCloud size={40} className="text-slate-700" strokeWidth={1} />
                  <p className="text-sm font-bold text-slate-400">Sin video todavía</p>
                  <p className="text-xs text-slate-600">El cliente aún no ha subido su material de campaña.</p>
                </div>
              )}
            </div>

            {/* RIGHT — Scrollable details */}
            <div className="lg:w-[45%] flex flex-col border-l border-white/5 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* Rejected reason */}
                {isRejected && order.rejection_reason && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-1">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Motivo de rechazo</p>
                    <p className="text-sm text-slate-400">{order.rejection_reason}</p>
                  </div>
                )}

                {/* Client contact */}
                <section>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Datos del cliente</p>
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 divide-y divide-white/5">
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
                        : <span className="text-slate-600">Sin teléfono</span>
                      }
                    />
                  </div>
                </section>

                {/* Bookings / Panel details */}
                {order.bookings?.map((b, i) => (
                  <section key={b.id}>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Monitor size={11} className="text-primary" /> Pantalla {order.bookings.length > 1 ? i + 1 : ''}
                    </p>
                    <div className="rounded-xl bg-white/[0.02] border border-white/5 divide-y divide-white/5">
                      <Row icon={<span className="text-[10px] font-mono">#</span>} label="Código panel" value={b.panels?.panel_code || b.panel_id.slice(0, 8)} />
                      <Row icon={<span className="text-[10px]">🎯</span>} label="Campaña" value={b.campaign_name || '—'} />
                      <Row icon={<Calendar size={13} />} label="Período"
                        value={`${fmt(b.start_date)} → ${fmt(b.end_date)}`}
                      />
                      {b.panels?.face && <Row icon={<span className="text-[10px]">↔</span>} label="Cara" value={b.panels.face} />}
                      {b.panels?.media_type && <Row icon={<Play size={13} />} label="Tipo" value={b.panels.media_type} />}
                      {b.panels?.format && <Row icon={<Ruler size={13} />} label="Formato" value={b.panels.format} />}
                      {(b.panels?.width || b.panels?.height) && (
                        <Row icon={<Ruler size={13} />} label="Dimensiones" value={`${b.panels.width}m × ${b.panels.height}m`} />
                      )}
                      {(b.panels?.resolution_width || b.panels?.resolution_height) && (
                        <Row icon={<Monitor size={13} />} label="Resolución" value={`${b.panels.resolution_width}×${b.panels.resolution_height}px`} />
                      )}
                    </div>

                    {/* Structure location */}
                    {b.panels?.structures && (
                      <div className="mt-2 rounded-xl bg-white/[0.02] border border-white/5 divide-y divide-white/5">
                        {b.panels.structures.code && <Row icon={<span className="text-[10px] font-mono">#</span>} label="Cód. estructura" value={b.panels.structures.code} />}
                        {b.panels.structures.address && <Row icon={<MapPin size={13} />} label="Dirección" value={b.panels.structures.address} />}
                        {b.panels.structures.reference && <Row icon={<span className="text-[10px]">📍</span>} label="Referencia" value={b.panels.structures.reference} />}
                        {b.panels.structures.district && <Row icon={<span className="text-[10px]">🏙</span>} label="Distrito" value={b.panels.structures.district} />}
                        {b.panels.structures.city && <Row icon={<span className="text-[10px]">🌆</span>} label="Ciudad" value={b.panels.structures.city} />}
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

                    <div className="flex justify-between items-center mt-2 px-1">
                      <span className="text-[10px] text-slate-600 uppercase tracking-widest">Monto</span>
                      <span className="text-sm font-black text-primary">S/ {Number(b.amount).toLocaleString('es-PE')}</span>
                    </div>
                  </section>
                ))}

                {/* Total */}
                <div className="flex items-center justify-between py-4 border-t border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total orden</span>
                  <span className="text-2xl font-black text-white">S/ {Number(order.total_amount).toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span>
                </div>
              </div>

              {/* ── STATIC ACTION BAR ── */}
              {isPending && order.video_url && (
                <div className="px-5 py-4 border-t border-white/5 shrink-0 flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={!!loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {loading === 'approve' ? <Spin /> : <CheckCircle2 size={16} />}
                    Aprobar Video
                  </button>
                  <button
                    onClick={() => setRejectOpen(true)}
                    disabled={!!loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <XCircle size={16} /> Rechazar
                  </button>
                </div>
              )}

              {order.status === 'PENDING_UPLOAD' && (
                <div className="px-5 py-4 border-t border-white/5 shrink-0 text-center">
                  <p className="text-xs text-slate-500">Contacta al cliente para que suba su video.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── REJECT MODAL ── */}
      {rejectOpen && (
        <div key="reject-modal-container">
          <motion.div
            key="reject-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 z-[300]"
            onClick={() => setRejectOpen(false)}
          />
          <motion.div
            key="reject-content"
            initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[310] w-full max-w-md bg-[#0e162b] border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400"><AlertTriangle size={20} /></div>
              <div>
                <h3 className="font-black text-white uppercase tracking-tight">Rechazar Video</h3>
                <p className="text-xs text-slate-500">Orden #{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">Indica el motivo para que el cliente pueda corregir su material.</p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: El video no cumple con las dimensiones requeridas (16:9)..."
              rows={4}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 resize-none mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectOpen(false)} className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all">Cancelar</button>
              <button
                onClick={handleReject}
                disabled={!!loading}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading === 'reject' ? <Spin /> : <XCircle size={14} />} Confirmar
              </button>
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
      <span className="text-slate-500 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest">{label}</p>
        <div className="text-sm font-bold text-white break-words">{value}</div>
      </div>
    </div>
  )
}
function Spin() {
  return <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
}
