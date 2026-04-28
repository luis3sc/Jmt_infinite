'use client'

import { FileVideo, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface UploadLoadingProps {
  progress: number
}

export function UploadLoading({ progress }: UploadLoadingProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col justify-center items-center py-12 md:py-20 w-full"
    >
      <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-lg p-10 md:p-16 max-w-lg w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
        
        <div className="relative mb-10">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
          />
          <div className="relative w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center border border-primary/20 shadow-inner">
            <FileVideo size={42} className="text-primary animate-pulse" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-lg"
            />
          </div>
        </div>
        
        <h2 className="text-3xl font-black text-foreground mb-3 tracking-tighter uppercase">Subiendo Material</h2>
        <p className="text-muted-foreground mb-10 font-medium px-4">
          Estamos procesando tu video de alta calidad. <br />
          <span className="text-xs opacity-70 italic">Por favor no cierres esta ventana.</span>
        </p>

        <div className="w-full space-y-4">
          <div className="flex justify-between items-end mb-2 px-2">
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Sincronizando</span>
            </div>
            <span className="text-3xl font-black tracking-tighter text-foreground">{Math.round(progress)}%</span>
          </div>
          
          <div className="h-4 bg-muted/50 rounded-full overflow-hidden p-1 border border-border/50 backdrop-blur-md">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
          </div>
          
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest pt-2">
            Conectando con Cloudflare R2 Edge
          </p>
        </div>
      </div>
    </motion.div>
  )
}
