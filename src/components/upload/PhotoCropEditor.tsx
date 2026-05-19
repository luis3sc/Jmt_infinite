'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { motion } from 'framer-motion'
import { Crop, Check } from 'lucide-react'

interface PhotoCropEditorProps {
  imageSrc: string
  /** Aspect ratio del panel: ej. 16/9 o 9/16. Por defecto 16/9 */
  aspectRatio?: number
  onCropComplete: (croppedArea: Area) => void
}

export function PhotoCropEditor({
  imageSrc,
  aspectRatio = 16 / 9,
  onCropComplete,
}: PhotoCropEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsVal: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsVal)
  }, [])

  function handleConfirm() {
    if (!croppedAreaPixels) return
    setConfirmed(true)
    onCropComplete(croppedAreaPixels)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Editor label */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Crop size={14} className="text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold tracking-wider text-foreground">
            Ajustar recorte
          </p>
          <p className="text-[10px] text-muted-foreground">
            Mueve y pellizca para encuadrar tu imagen dentro del panel
          </p>
        </div>
      </div>

      {/* Crop canvas */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-border/50 bg-black"
        style={{ height: 'min(65vw, 280px)' }}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          showGrid={true}
          style={{
            containerStyle: { borderRadius: '1rem', background: '#000' },
            cropAreaStyle: {
              border: '2px solid hsl(var(--primary))',
              boxShadow: '0 0 0 9999em rgba(0,0,0,0.65)',
            },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-8">
          {zoom.toFixed(1)}x
        </span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full appearance-none bg-border accent-primary cursor-pointer"
        />
      </div>

      {/* Confirm button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleConfirm}
        disabled={confirmed}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all
          ${confirmed
            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
            : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
          }`}
      >
        <Check size={16} />
        {confirmed ? 'Confirmado' : 'Confirmar'}
      </motion.button>
    </div>
  )
}
