'use client'

import { useState } from 'react'
import { Check, ExternalLink, ShieldCheck, Clock, Play, Sparkles, MapPin, Monitor, Layers, FileVideo, RotateCcw, Pencil, AlertCircle } from 'lucide-react'
import { OrderTrackingStepper, type OrderStatus } from '@/components/ui/OrderTrackingStepper'
import { motion, Variants } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/lib/utils'

export interface ScreenVideoItem {
  bookingId: string
  panelCode: string
  panelName?: string
  district?: string
  address?: string
  resolutionWidth?: number
  resolutionHeight?: number
  slotDurationSeconds?: number
  videoUrl?: string | null
}

interface UploadSuccessProps {
  videoUrl?: string
  orderId?: string
  status?: string
  screens?: ScreenVideoItem[]
  onEdit?: (targetBookingId?: string) => void
}

export function UploadSuccess({ videoUrl, orderId, status, screens = [], onEdit }: UploadSuccessProps) {
  const router = useRouter()
  const [loadingBtn, setLoadingBtn] = useState(false)
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)

  const isEditable = !status || ['PENDING_UPLOAD', 'VIDEO_SENT', 'PENDING_VALIDATION', 'REJECTED'].includes(status)

  // Normalizar lista de pantallas para mostrar
  const displayScreens: ScreenVideoItem[] = screens.length > 0
    ? screens
    : [
        {
          bookingId: 'default',
          panelCode: 'PANEL',
          panelName: 'Pantalla Digital',
          district: 'Ubicación',
          videoUrl: videoUrl,
          resolutionWidth: 1280,
          resolutionHeight: 720,
          slotDurationSeconds: 7,
        },
      ]

  const handleFinish = async () => {
    setLoadingBtn(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard/orders')
      } else {
        router.push('/')
      }
    } catch {
      router.push('/')
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 20,
      },
    },
  }

  const trackingStatus = (status as OrderStatus) || 'VIDEO_SENT'

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-7xl mx-auto relative px-2 sm:px-4 py-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        
        {/* ── COLUMNA IZQUIERDA: CARDS VERTICALES DE UBICACIONES Y VIDEOS ─────── */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-7 flex flex-col space-y-5 w-full"
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers size={15} className="text-primary" />
              Videos enviados por ubicación ({displayScreens.length})
            </h3>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <Check size={13} />
              Todos los videos cargados
            </span>
          </div>

          {/* Lista Vertical de Tarjetas con su Reproductor de Video */}
          <div className="space-y-5">
            {displayScreens.map((scr, idx) => {
              const scrVideoUrl = scr.videoUrl || videoUrl
              const isHovered = hoveredCardIndex === idx

              return (
                <div
                  key={scr.bookingId || idx}
                  onMouseEnter={() => setHoveredCardIndex(idx)}
                  onMouseLeave={() => setHoveredCardIndex(null)}
                  className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md shadow-sm p-4 sm:p-5 space-y-3.5 transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                >
                  {/* Card Header: Icon, Location, District & Code */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        <Monitor size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                            Ubicación {idx + 1} de {displayScreens.length}
                          </span>
                          <span className="text-[10px] font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                            #{scr.panelCode}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-black text-foreground leading-tight mt-0.5">
                          {scr.district ? `${scr.district} (${scr.panelCode})` : `Pantalla #${scr.panelCode}`}
                          {scr.address && (
                            <span className="text-xs font-medium text-muted-foreground ml-2 font-sans">
                              — {scr.address}
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>

                    {/* Specs badge */}
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Check size={12} />
                        {scr.resolutionWidth || 1280}×{scr.resolutionHeight || 720} ({scr.slotDurationSeconds || 7}s)
                      </span>
                    </div>
                  </div>

                  {/* Video Player Box for this specific Location */}
                  <div className="relative aspect-video w-full rounded-xl bg-black border border-border/60 overflow-hidden shadow-inner group">
                    {scrVideoUrl ? (
                      <video
                        src={scrVideoUrl}
                        controls
                        playsInline
                        autoPlay
                        muted
                        loop
                        preload="auto"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-2">
                        <Play className="text-white/20 fill-white/10" size={32} />
                        <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                          Video enviado
                        </span>
                      </div>
                    )}

                    {/* Overlay Tag inside Video */}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 pointer-events-none z-10">
                      <Check size={11} />
                      PREVIEW DIGITAL — {scr.panelCode}
                    </div>
                  </div>

                  {/* Card Footer controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium truncate max-w-xs sm:max-w-md">
                      <FileVideo size={14} className="text-primary shrink-0" />
                      <span className="truncate">Spot publicitario enviado</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditable && onEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(scr.bookingId)}
                          className="text-xs font-bold border-border/70 hover:border-primary/50 hover:text-primary h-8 gap-1.5 shrink-0"
                        >
                          <Pencil size={12} />
                          Cambiar este video
                        </Button>
                      )}

                      {scrVideoUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(scrVideoUrl, '_blank')}
                          className="text-xs font-bold border-border/70 hover:border-primary/50 hover:text-primary h-8 gap-1.5 shrink-0"
                        >
                          <ExternalLink size={13} />
                          Abrir video
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── COLUMNA DERECHA: ESTADO, PASOS VERTICALES Y ACCIONES ───────────── */}
        <div className="lg:col-span-5 flex flex-col space-y-5 lg:sticky lg:top-24 lg:self-start">
          <motion.div variants={itemVariants} className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-[0.2em] border border-emerald-500/20 mb-2">
                <Check size={11} />
                Material Recibido Exitosamente
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                ¡{displayScreens.length > 1 ? 'Tus anuncios han sido' : 'Tu anuncio ha sido'} <span className="text-primary font-bold">enviado!</span>
              </h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {displayScreens.length > 1
                  ? `Se recibieron correctamente los videos para tus ${displayScreens.length} pantallas contratadas.`
                  : 'Tu video ha sido procesado y enviado a nuestro equipo de moderación.'}
              </p>
            </div>

            {/* Order Tracking Stepper VERTICAL */}
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-card/70 border border-border/60 shadow-sm backdrop-blur-md space-y-3">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                Estado de tu campaña
              </p>
              
              {/* Stepper forzado en layout vertical para textos amplios */}
              <OrderTrackingStepper status={trackingStatus} layout="vertical" />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full pt-1">
              <Button
                disabled={loadingBtn}
                onClick={handleFinish}
                isLoading={loadingBtn}
                size="xl"
                className="w-full font-black text-sm shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4)] flex justify-center items-center gap-2 disabled:opacity-50 h-12"
              >
                Listo, ir a Mis Campañas
              </Button>

              {isEditable && onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  onClick={() => onEdit()}
                  className="w-full font-bold text-sm border-2 border-border/80 hover:border-primary/50 hover:bg-primary/5 h-12 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={15} className="text-primary" />
                  Cambiar o editar videos
                </Button>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            {isEditable ? (
              <Alert variant="info" className="p-3.5 text-xs space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles size={13} className="text-primary" />
                  ¿Te equivocaste de video o deseas cambiarlo?
                </div>
                <p className="text-muted-foreground">
                  Puedes reemplazar los videos las veces que necesites antes de que sean aprobados y programados.
                </p>
              </Alert>
            ) : (
              <Alert variant="info" className="p-3.5 text-xs">
                Te avisaremos al WhatsApp y correo de inmediato cuando tu anuncio sea aprobado. Tiempo estimado: <strong className="text-foreground">24 horas útiles</strong>.
              </Alert>
            )}
          </motion.div>
        </div>

      </div>
    </motion.div>
  )
}
