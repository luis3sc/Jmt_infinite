'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, MapPin, Users, DollarSign,
  Monitor, Eye, X, ChevronRight, Clock, Maximize2, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'

interface Panel {
  id: string
  panel_code: string
  width: number | null
  height: number | null
  format: string | null
  face: string | null
  audience: number | null
  media_type: string | null
  structures: {
    address: string | null
    district: string | null
    organization_id: string | null
    organizations: {
      name: string | null
    } | null
  } | null
}

interface Booking {
  id: string
  start_date: string
  end_date: string
  amount: number
  campaign_name: string
  panels: Panel | null
}

interface Order {
  id: string
  status: string
  video_url: string | null
  total_amount: number | null
  rejection_reason: string | null
  evidence_urls?: string[] | null
  created_at: string
  user_id: string
  bookings: Booking[]
  profiles: {
    full_name: string | null
    company_name: string | null
    document_type: string | null
    document_number: string | null
    phone: string | null
    receipt_type: string | null
    email: string | null
  } | null
}

interface OrderResumenClientProps {
  order: Order
}

export default function OrderResumenClient({ order }: OrderResumenClientProps) {
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null)

  // 1. Calculate general campaign metrics
  const totalAmount = order.total_amount || 0
  const totalPanels = order.bookings?.length || 0

  // Calculate start/end range and total days of the campaign
  let minDate: Date | null = null
  let maxDate: Date | null = null
  let totalAudience = 0

  order.bookings?.forEach((b) => {
    if (b.start_date) {
      const start = new Date(b.start_date)
      if (!minDate || start < minDate) minDate = start
    }
    if (b.end_date) {
      const end = new Date(b.end_date)
      if (!maxDate || end > maxDate) maxDate = end
    }

    // Reach Calculation: (audience / 30) * days
    if (b.start_date && b.end_date) {
      const days = Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
      const dailyAudience = b.panels?.audience ? b.panels.audience / 30 : 4100
      totalAudience += Math.round(dailyAudience * days)
    }
  })

  const durationStr = minDate && maxDate
    ? `${minDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })} al ${maxDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : 'No definido'

  const totalDays = minDate && maxDate
    ? Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0

  const campaignName = order.bookings?.[0]?.campaign_name || 'Campaña'
  const shortId = order.id.slice(0, 8).toUpperCase()

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24">
      <TopBar right={<AuthButton />} />

      <Container maxW="6xl" className="pt-20 md:pt-24 flex-1 flex flex-col">
        {/* BACK NAVIGATION */}
        <div className="mb-6">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver a mis pedidos</span>
          </Link>
        </div>

        {/* HEADER BLOCK */}
        <header className="mb-8 md:p-8 relative">

          <div className="space-y-2 relative z-10">

            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-foreground leading-tight">
              {campaignName}
            </h1>
            <p className="text-xs text-muted-foreground">
              Esta campaña ya está aprobada y su contenido se encuentra instalado en la vía pública.
            </p>
          </div>
        </header>

        {/* METRICS PANEL (Inspired by structure modal styling) */}
        {/* METRICS PANEL */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-4 md:gap-8 items-start mb-8">
          {/* Inversión */}
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground">Inversión Total</span>
              <span className="text-sm text-muted-foreground truncate">
                S/ {totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Duración */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground">Duración</span>
              <span className="text-sm text-muted-foreground truncate">
                {totalDays} {totalDays === 1 ? 'Día' : 'Días'}
              </span>
            </div>
          </div>

          {/* Pantallas */}
          <div className="flex items-start gap-3">
            <Monitor className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground">Pantallas</span>
              <span className="text-sm text-muted-foreground truncate">
                {totalPanels} {totalPanels === 1 ? 'Pantalla' : 'Pantallas'}
              </span>
            </div>
          </div>

          {/* Alcance */}
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground">Alcance Total Est.</span>
              <span className="text-sm text-muted-foreground truncate">
                {totalAudience.toLocaleString('es-PE')}
              </span>
            </div>
          </div>
        </section>

        {/* DETALLE DE PANTALLAS */}
        <section className="space-y-6">
          <div className="">

            <p className="text-xs text-muted-foreground">
              A continuación se listan las pantallas contratadas junto a las imágenes de prueba capturadas en calle.
            </p>
          </div>

          <div className="space-y-6">
            {order.bookings?.map((b, idx) => {
              const bookingEvidences = order.evidence_urls?.filter((url) => url.includes(`booking_${b.id}`)) || [];
              const panel = b.panels;
              const structure = panel?.structures;

              return (
                <div
                  key={b.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden grid grid-cols-1 lg:grid-cols-12"
                >
                  {/* Left Column: Panel Info */}
                  <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      {/* Top Header info */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Pantalla {idx + 1}</span>
                          <h3 className="text-base font-black text-foreground flex items-center gap-1.5 mt-0.5">
                            <Monitor size={16} className="text-primary" />
                            {panel?.panel_code || b.id.slice(0, 8)}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-muted border border-border text-[10px] font-mono font-bold text-foreground">
                          CARA {panel?.face || 'A'}
                        </span>
                      </div>

                      {/* Details specs list */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Ubicación</span>
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            <MapPin size={12} className="text-muted-foreground" />
                            {structure?.district || '—'}
                          </p>
                          <p className="text-muted-foreground text-[11px] leading-tight mt-0.5">{structure?.address || '—'}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">Formato</span>
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            <Monitor size={12} className="text-muted-foreground" />
                            {panel?.media_type || 'Digital'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Evidence Images */}
                  <div className="lg:col-span-7 p-6 bg-muted/10">
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2">
                        <Eye size={14} /> Evidencia de Instalación
                      </h4>
                      {bookingEvidences.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {bookingEvidences.map((url: string, imgIdx: number) => (
                            <div
                              key={imgIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePreviewUrl(url);
                              }}
                              className="relative aspect-[4/3] rounded-lg border border-border bg-muted hover:border-primary transition-all cursor-pointer group overflow-hidden shadow-sm"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Evidencia ${b.id} - ${imgIdx}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye size={16} className="text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-24 flex items-center justify-center border border-dashed border-border rounded-lg bg-background">
                          <p className="text-xs text-muted-foreground">Sin evidencia disponible</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>        {/* BOTTOM ACTION BUTTON */}
        <div className="mt-12 flex justify-center border-t border-border pt-8">
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black uppercase tracking-widest shadow-md shadow-primary/10 active:scale-98 transition-all"
          >
            <ArrowLeft size={14} />
            <span>Volver a Pedidos</span>
          </Link>
        </div>
      </Container>

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
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
