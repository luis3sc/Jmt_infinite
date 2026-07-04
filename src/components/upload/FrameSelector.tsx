'use client'

import { CheckCircle2, Crop } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export interface Frame {
  id: string
  label: string
  src: string
}

// Marcos disponibles — agrega más archivos en /public/assets/frames/
export const AVAILABLE_FRAMES: Frame[] = [
  { id: 'none', label: 'Sin Marco', src: '' },
  { id: 'birthday', label: 'Cumpleaños', src: '/assets/frames/frame-birthday.png' },
  { id: 'special', label: 'Especial', src: '/assets/frames/frame2.png' },
  { id: 'couple', label: 'Pareja', src: '/assets/frames/frame3.png' },
]

interface FrameSelectorProps {
  /** Preview de la imagen recortada (para mostrar con el marco encima) */
  previewSrc: string
  selectedFrameId: string
  onSelectFrame: (frame: Frame) => void
  onEditCrop?: () => void
}

export function FrameSelector({ previewSrc, selectedFrameId, onSelectFrame, onEditCrop }: FrameSelectorProps) {
  const selectedFrame = AVAILABLE_FRAMES.find((f) => f.id === selectedFrameId) ?? AVAILABLE_FRAMES[0]

  return (
    <div className="flex flex-col gap-fluid-xs">
      <div>
        <p className="text-fluid-xs font-bold tracking-wider text-foreground mb-fluid-3xs">
          Selecciona un marco
        </p>
        <p className="text-fluid-2xs text-muted-foreground">
          Opcional: añade un marco decorativo sobre tu imagen
        </p>
      </div>

      {/* Live preview con marco encima */}
      <div className="relative w-full rounded-card overflow-hidden bg-black border border-border/50 aspect-video">
        {previewSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="Imagen recortada" className="w-full h-full object-cover" />
        )}
        {selectedFrame.src && (
          <Image
            src={selectedFrame.src}
            alt={selectedFrame.label}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 right-2 text-[9px] font-bold uppercase tracking-widest bg-black/60 text-white px-2 py-0.5 rounded-full pointer-events-none">
          Previsualización
        </div>
        {onEditCrop && (
          <button
            onClick={onEditCrop}
            className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-10 backdrop-blur-sm"
            title="Volver al recorte"
          >
            <Crop size={16} />
          </button>
        )}
      </div>

      {/* Carrusel de miniaturas */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {AVAILABLE_FRAMES.map((frame) => {
          const isSelected = frame.id === selectedFrameId
          return (
            <motion.button
              key={frame.id}
              onClick={() => onSelectFrame(frame)}
              className={`relative flex-shrink-0 w-[90px] h-[52px] rounded-card overflow-hidden border-2 transition-all duration-200
                ${isSelected ? 'border-primary shadow-lg shadow-primary/30' : 'border-border/50 hover:border-border'}`}
            >
              {frame.src ? (
                <Image src={frame.src} alt={frame.label} fill sizes="90px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-muted/40 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-muted-foreground text-center leading-tight px-1">
                    Sin<br />Marco
                  </span>
                </div>
              )}
              {isSelected && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-primary" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5 truncate px-1">
                {frame.label}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
