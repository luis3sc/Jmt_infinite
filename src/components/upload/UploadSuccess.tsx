'use client'

import { Check, ExternalLink, ArrowLeft, ShieldCheck, Clock, Share2, Play, Info, Sparkles } from 'lucide-react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface UploadSuccessProps {
  videoUrl?: string;
  orderId?: string;
  status?: string;
}

export function UploadSuccess({ videoUrl, orderId, status }: UploadSuccessProps) {
  const router = useRouter()
  const [loadingBtn, setLoadingBtn] = useState(false)
  const [isVideoHovered, setIsVideoHovered] = useState(false)
  
  const handleFinish = async () => {
    setLoadingBtn(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
    } catch (error) {
      router.push('/')
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        stiffness: 120,
        damping: 20
      }
    }
  }

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    'PENDING_VALIDATION': { label: 'En Validación', color: 'text-amber-500 bg-amber-500/10', icon: ShieldCheck },
    'VIDEO_SENT': { label: 'En Revisión', color: 'text-blue-500 bg-blue-500/10', icon: Clock },
    'COMPLETED': { label: 'Confirmado', color: 'text-emerald-500 bg-emerald-500/10', icon: Check },
  }

  const currentStatus = statusMap[status || 'VIDEO_SENT'] || statusMap['VIDEO_SENT']

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-7xl mx-auto relative px-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-center">
        
        {/* VIDEO PREVIEW - ON TOP ON MOBILE */}
        <motion.div 
          variants={itemVariants}
          className="w-full flex justify-center lg:justify-end order-1 lg:order-2"
        >
          <div 
            className="relative w-full max-w-2xl group perspective-2000"
            onMouseEnter={() => setIsVideoHovered(true)}
            onMouseLeave={() => setIsVideoHovered(false)}
          >
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-primary/20 rounded-lg blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Panel/Screen Mockup Frame - HORIZONTAL Aspect Ratio */}
            <motion.div 
              animate={{ 
                rotateY: isVideoHovered ? 2 : 0,
                rotateX: isVideoHovered ? -2 : 0,
                scale: isVideoHovered ? 1.01 : 1
              }}
              className="relative aspect-video w-full rounded-lg bg-zinc-950 p-1.5 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] ring-1 ring-white/10 overflow-hidden"
            >
              {/* Inner Bezel */}
              <div className="h-full w-full rounded-lg overflow-hidden bg-black relative">
                {videoUrl ? (
                  <video 
                    src={videoUrl} 
                    className="w-full h-full object-cover"
                    controls={false}
                    playsInline
                    autoPlay
                    muted
                    loop
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 animate-pulse flex items-center justify-center">
                      <Play className="text-white/20 fill-white/10" size={32} />
                    </div>
                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Sin vista previa</span>
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Status Badge in Video */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                  <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-white uppercase tracking-wider">PREVIEW DIGITAL</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                    <Sparkles size={14} className="text-white" />
                  </div>
                </div>

                {/* Bottom Order ID */}
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5">Campaña Activa</p>
                  <p className="text-base font-black text-white tracking-tight">#{orderId?.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              
              {/* Screen Glare & Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none z-30" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none z-30" />
              
              {/* Premium Reflection Effect */}
              <div className="absolute -inset-x-20 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent -rotate-12 pointer-events-none z-20" />
            </motion.div>
            
            {/* Ambient Shadow/Glow */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-primary/10 blur-2xl rounded-full pointer-events-none" />
          </div>
        </motion.div>

        {/* TEXT CONTENT & ACTIONS */}
        <div className="flex flex-col gap-4 md:gap-8 order-2">
          <motion.div variants={itemVariants} className="space-y-3 md:space-y-6">
            <div className="flex flex-col items-start">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" as const, stiffness: 200, delay: 0.3 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-4 md:mb-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <Check size={12} strokeWidth={3} />
                <span>Material Recibido</span>
              </motion.div>

              <h2 className="text-3xl md:text-7xl font-black text-foreground mb-3 md:mb-6 tracking-tight leading-[0.95]">
                TODO <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 italic underline decoration-primary/20 underline-offset-4 md:underline-offset-8">LISTO.</span>
              </h2>

              <p className="text-sm md:text-lg text-muted-foreground leading-relaxed mb-4 md:mb-10 max-w-md font-medium opacity-80">
                Material recibido. Lo validaremos en las próximas horas.
              </p>

              {/* Status Pills — compact on mobile */}
              <div className="flex flex-wrap gap-2 md:gap-4 mb-4 md:mb-10 w-full">
                <div className="bg-background/40 border border-border/40 px-3 py-2 rounded-lg flex items-center gap-2 flex-1 min-w-[130px]">
                  <div className={`w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-lg ${currentStatus.color} flex items-center justify-center shrink-0`}>
                    <currentStatus.icon size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground/60">Estado</span>
                    <p className="text-[10px] md:text-xs font-black">{currentStatus.label}</p>
                  </div>
                </div>

                <div className="bg-background/40 border border-border/40 px-3 py-2 rounded-lg flex items-center gap-2 flex-1 min-w-[130px]">
                  <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Clock size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground/60">Próximo Paso</span>
                    <p className="text-[10px] md:text-xs font-black">Validación</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  onClick={() => window.open(videoUrl, '_blank')}
                  className="w-full sm:w-fit flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-card/50 backdrop-blur-sm border border-border shadow-sm hover:bg-muted hover:border-primary/20 transition-all active:scale-95 group text-sm font-semibold"
                >
                  <ExternalLink size={16} className="text-primary" />
                  <span className="text-muted-foreground group-hover:text-foreground">Ver Video</span>
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-start gap-3 p-4 rounded-lg md:rounded-lg bg-primary/5 border border-primary/10"
          >
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
              <Info size={14} />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Te notificaremos cuando el material sea aprobado. Tiempo estimado: <span className="text-foreground font-bold">24 hrs hábiles</span>.
            </p>
          </motion.div>
        </div>

      </div>
    </motion.div>
  )
}
