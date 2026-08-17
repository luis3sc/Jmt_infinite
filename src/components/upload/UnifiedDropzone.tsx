'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { UploadCloud, CheckCircle2, FileVideo, ImageIcon, AlertTriangle, MousePointer2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { buttonVariants, buttonSizes } from '@/components/ui/Button'
import { analyzeVideoFile, isAspectRatioCompatible, VideoMetadata } from '@/lib/videoAnalyzer'

interface UnifiedDropzoneProps {
  targetWidth?: number
  targetHeight?: number
  targetDuration?: number
  onFileSelect: (file: File, type: 'video' | 'image', videoMeta?: VideoMetadata) => void
  disabled?: boolean
}

export function UnifiedDropzone({
  targetWidth = 1280,
  targetHeight = 720,
  targetDuration = 7,
  onFileSelect,
  disabled = false,
}: UnifiedDropzoneProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzedFile, setAnalyzedFile] = useState<{
    file: File
    type: 'video' | 'image'
    meta?: VideoMetadata
    isRatioCompatible?: boolean
  } | null>(null)

  const targetRatio = targetHeight > 0 ? targetWidth / targetHeight : 16 / 9

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0]
        if (error?.code === 'file-too-large') {
          alert('El archivo excede el tamaño máximo permitido de 100MB.')
        } else if (error?.code === 'file-invalid-type') {
          alert('Formato no soportado. Por favor sube un video (MP4, MOV, AVI, WEBM) o imagen (JPG, PNG).')
        }
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')

      if (!isVideo && !isImage) {
        alert('Por favor selecciona un archivo de video o una imagen.')
        return
      }

      setAnalyzing(true)
      try {
        if (isVideo) {
          const meta = await analyzeVideoFile(file)
          const ratioCompatible = isAspectRatioCompatible(meta.aspectRatio, targetRatio, 0.15)
          setAnalyzedFile({ file, type: 'video', meta, isRatioCompatible: ratioCompatible })
          onFileSelect(file, 'video', meta)
        } else {
          setAnalyzedFile({ file, type: 'image' })
          onFileSelect(file, 'image')
        }
      } catch (err) {
        console.error('Error al analizar archivo:', err)
        setAnalyzedFile({ file, type: isVideo ? 'video' : 'image' })
        onFileSelect(file, isVideo ? 'video' : 'image')
      } finally {
        setAnalyzing(false)
      }
    },
    [targetRatio, onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: disabled || analyzing,
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative group w-full rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 md:p-8 text-center overflow-hidden cursor-pointer min-h-[200px] md:min-h-[240px]",
          isDragActive
            ? 'border-primary bg-primary/10 scale-[1.01] shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)]'
            : isDragReject
            ? 'border-destructive bg-destructive/10'
            : 'border-border/60 bg-card/40 backdrop-blur-md hover:bg-card/70 hover:border-primary/50',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {analyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center space-y-3"
            >
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-semibold text-muted-foreground">Analizando resolución y formato...</p>
            </motion.div>
          ) : analyzedFile ? (
            <motion.div
              key="analyzed"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="space-y-3 flex flex-col items-center relative z-10 w-full max-w-md"
            >
              <div className="relative">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                  {analyzedFile.type === 'video' ? (
                    <FileVideo size={32} strokeWidth={1.5} />
                  ) : (
                    <ImageIcon size={32} strokeWidth={1.5} />
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 text-white border-2 border-card shadow-md">
                    <CheckCircle2 size={12} strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-center w-full">
                <p className="text-sm font-bold text-foreground truncate px-4">{analyzedFile.file.name}</p>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <span className="bg-muted/70 px-2 py-0.5 rounded-md uppercase font-bold text-foreground">
                    {analyzedFile.type === 'video' ? 'Video' : 'Imagen'}
                  </span>
                  <span>•</span>
                  <span>{(analyzedFile.file.size / (1024 * 1024)).toFixed(2)} MB</span>

                  {analyzedFile.meta && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-foreground">
                        {analyzedFile.meta.width}×{analyzedFile.meta.height}
                      </span>
                      <span>•</span>
                      <span>{analyzedFile.meta.duration.toFixed(1)}s</span>
                    </>
                  )}
                </div>

                {analyzedFile.type === 'video' && analyzedFile.isRatioCompatible === false && (
                  <div className="mt-2 text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-2 rounded-lg flex items-center justify-center gap-1.5 text-left">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>
                      El aspect ratio ({analyzedFile.meta?.width}×{analyzedFile.meta?.height}) difiere del panel ({targetWidth}×{targetHeight}). El sistema lo ajustará automáticamente sin deformar el contenido.
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-1">
                <span className="text-[11px] font-semibold text-primary underline group-hover:opacity-80">
                  Haz clic o arrastra para cambiar archivo
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 flex flex-col items-center relative z-10"
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                isDragActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-primary/10 text-primary group-hover:bg-primary/20'
              )}>
                <UploadCloud size={32} strokeWidth={1.5} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  {isDragActive ? 'Suelta tu archivo aquí' : 'Sube tu video o imagen publicitaria'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Arrastra y suelta tu archivo aquí (MP4, MOV, JPG, PNG) o haz clic para explorar
                </p>
              </div>

              <div className={cn(
                buttonVariants.outline,
                buttonSizes.sm,
                "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer mt-1"
              )}>
                <MousePointer2 size={13} className="text-primary" />
                <span>Seleccionar Archivo</span>
              </div>

              <div className="text-[10px] text-muted-foreground/70 font-medium">
                Especificación objetivo: <strong className="text-foreground">{targetWidth}×{targetHeight}</strong> ({targetDuration} seg)
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
