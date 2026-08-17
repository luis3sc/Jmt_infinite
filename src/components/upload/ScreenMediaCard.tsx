'use client'

import React, { useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Monitor, CheckCircle2, Clock, ShieldCheck, RefreshCw, UploadCloud, AlertCircle, FileVideo, ImageIcon, RotateCcw, MousePointer2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export interface ScreenBookingInfo {
  bookingId: string
  panelId: string
  panelCode: string
  panelName?: string
  district?: string
  city?: string
  address?: string
  resolutionWidth: number
  resolutionHeight: number
  slotDurationSeconds: number
  operatingStartTime?: string
  operatingEndTime?: string
  videoUrl?: string | null
}

export interface MediaState {
  file: File | null
  fileType: 'image' | 'video' | null
  processedBlob: Blob | null
  previewUrl: string | null
  status: 'idle' | 'processing' | 'ready' | 'error'
  progress?: number
  error?: string
  isExisting?: boolean
  originalUrl?: string | null
}

interface ScreenMediaCardProps {
  screen: ScreenBookingInfo
  media: MediaState
  onFileSelect: (file: File, type: 'video' | 'image') => void
  onRemoveMedia: () => void
  onRestoreOriginal?: () => void
  totalScreens: number
  index: number
}

export function ScreenMediaCard({
  screen,
  media,
  onFileSelect,
  onRemoveMedia,
  onRestoreOriginal,
  totalScreens,
  index,
}: ScreenMediaCardProps) {
  const isReady = media.status === 'ready' && !!media.previewUrl
  const isProcessing = media.status === 'processing'
  const isError = media.status === 'error'
  const isExisting = !!media.isExisting
  const canRestore = !isExisting && !!media.originalUrl

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0]
        if (error?.code === 'file-too-large') {
          alert('El archivo excede el tamaño máximo permitido de 100MB.')
        } else {
          alert('Formato no soportado. Sube un video (MP4, MOV, AVI) o imagen (JPG, PNG).')
        }
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')

      if (!isVideo && !isImage) {
        alert('Por favor selecciona un archivo de video o imagen válido.')
        return
      }

      onFileSelect(file, isVideo ? 'video' : 'image')
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject, open: openFileDialog } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
    disabled: isProcessing,
    noClick: isReady, // don't hijack video player clicks when ready
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "rounded-2xl border transition-all duration-300 p-5 bg-card/80 backdrop-blur-md shadow-sm space-y-4 relative",
        isDragActive && "ring-2 ring-primary border-primary bg-primary/[0.04]",
        isReady
          ? isExisting
            ? "border-blue-500/30 bg-blue-500/[0.015]"
            : "border-emerald-500/40 bg-emerald-500/[0.02]"
          : isProcessing
          ? "border-amber-500/40 bg-amber-500/[0.015]"
          : "border-border/70 hover:border-primary/40"
      )}
    >
      <input {...getInputProps()} />

      {/* Header: Title, Code, Location & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-sm",
              isReady
                ? isExisting
                  ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : isProcessing
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                : "bg-primary/10 text-primary border border-primary/20"
            )}
          >
            {isReady ? <CheckCircle2 size={18} /> : <Monitor size={18} />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Pantalla {index + 1} de {totalScreens}
              </span>
              <span className="text-[10px] font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                #{screen.panelCode}
              </span>
              <span className="text-[10px] text-muted-foreground/80 font-medium">
                • {screen.resolutionWidth}×{screen.resolutionHeight} ({screen.slotDurationSeconds}s)
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-foreground leading-tight mt-0.5">
              {screen.district || `Pantalla ${screen.panelCode}`}
              {screen.address && (
                <span className="text-xs font-medium text-muted-foreground ml-2">
                  — {screen.address}
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0 flex items-center gap-2">
          {isReady ? (
            isExisting ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm">
                <CheckCircle2 size={13} />
                Video actual guardado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                <CheckCircle2 size={13} />
                Nuevo video listo para guardar
              </span>
            )
          ) : isProcessing ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm animate-pulse">
              <RefreshCw size={12} className="animate-spin" />
              Procesando ({media.progress ?? 0}%)
            </span>
          ) : isError ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertCircle size={13} />
              Error
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted/60 text-muted-foreground border border-border">
              <UploadCloud size={13} />
              Sin material
            </span>
          )}
        </div>
      </div>

      {/* Content Area: Dropzone or Processed Player */}
      <div>
        {isReady && media.previewUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden aspect-video max-h-[320px] w-full bg-black border border-border/60 shadow-inner group/player">
              <video
                key={media.previewUrl}
                src={media.previewUrl}
                autoPlay
                loop
                muted
                playsInline
                controls
                className="w-full h-full object-contain"
              />
              
              {/* Overlay Tag */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 pointer-events-none z-10">
                <CheckCircle2 size={11} />
                {isExisting ? `VIDEO ACTUAL — ${screen.panelCode}` : `NUEVO SPOT (${screen.resolutionWidth}×${screen.resolutionHeight})`}
              </div>

              {/* Drag over overlay when dropping over video */}
              {isDragActive && (
                <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20 transition-all">
                  <UploadCloud size={36} className="animate-bounce mb-2" />
                  <p className="font-black text-sm">Suelta para reemplazar este video</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5 px-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium truncate max-w-md">
                {media.fileType === 'image' ? (
                  <ImageIcon size={14} className="text-primary shrink-0" />
                ) : (
                  <FileVideo size={14} className="text-primary shrink-0" />
                )}
                <span className="truncate">
                  {media.file?.name
                    ? `Archivo nuevo: ${media.file.name}`
                    : isExisting
                    ? 'Video enviado actualmente a moderación'
                    : 'Archivo procesado'}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {canRestore && onRestoreOriginal && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRestoreOriginal()
                    }}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground h-8 gap-1.5 shrink-0"
                  >
                    <RotateCcw size={12} />
                    Deshacer cambio
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    openFileDialog()
                  }}
                  className="text-xs font-bold border-border/70 hover:border-primary/50 hover:text-primary h-8 gap-1.5 shrink-0"
                >
                  <RotateCcw size={12} />
                  Reemplazar / Cambiar
                </Button>
              </div>
            </div>
          </div>
        ) : isProcessing ? (
          <div className="rounded-2xl bg-amber-500/[0.03] border-2 border-dashed border-amber-500/40 p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[180px]">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <RefreshCw size={24} className="animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                Procesando y convirtiendo material...
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                Adaptando a {screen.resolutionWidth}×{screen.resolutionHeight} y {screen.slotDurationSeconds} segundos sin deformar la imagen.
              </p>
            </div>
            <div className="w-full max-w-xs bg-muted/60 h-2 rounded-full overflow-hidden border border-border">
              <div
                className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${media.progress ?? 0}%` }}
              />
            </div>
          </div>
        ) : (
          <div
            onClick={openFileDialog}
            className={cn(
              "relative rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 md:p-10 text-center cursor-pointer min-h-[180px]",
              isDragActive
                ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg shadow-primary/10'
                : isDragReject
                ? 'border-destructive bg-destructive/10'
                : 'border-border/70 bg-card/40 hover:bg-card/90 hover:border-primary/50'
            )}
          >
            <div className="space-y-3 flex flex-col items-center">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform shadow-inner",
                isDragActive ? 'bg-primary text-white scale-110' : 'bg-primary/10 text-primary'
              )}>
                <UploadCloud size={28} strokeWidth={1.5} />
              </div>

              <div className="space-y-0.5">
                <h4 className="text-sm md:text-base font-bold text-foreground">
                  {isDragActive ? 'Suelta tu archivo aquí' : 'Sube tu video o imagen publicitaria'}
                </h4>
                <p className="text-xs text-muted-foreground font-medium">
                  Arrastra y suelta tu archivo, o haz clic para buscar
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border border-border/80 bg-background text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground shadow-sm mt-1">
                <MousePointer2 size={13} className="text-primary" />
                <span>Seleccionar Archivo</span>
              </div>

              <p className="text-[10px] text-muted-foreground/70 font-medium">
                Especificación objetivo: <strong className="text-foreground">{screen.resolutionWidth}×{screen.resolutionHeight}</strong> ({screen.slotDurationSeconds} seg)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
