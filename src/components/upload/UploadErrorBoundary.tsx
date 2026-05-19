'use client'

import { ImageOff, Video, RefreshCw, ArrowLeft } from 'lucide-react'
import { ErrorBoundary, type ErrorBoundaryProps } from '@/components/ui/ErrorBoundary'
import type { ReactNode } from 'react'

// ─── Upload-specific fallback UI ─────────────────────────────────────────────

interface UploadFallbackUIProps {
  error: Error
  reset: () => void
  /** 'crop' | 'frame' | 'dropzone' | 'generic' */
  step: 'crop' | 'frame' | 'dropzone' | 'generic'
  onGoBack?: () => void
}

function UploadFallbackUI({ error, reset, step, onGoBack }: UploadFallbackUIProps) {
  const stepLabels: Record<typeof step, { icon: typeof ImageOff; title: string; detail: string }> = {
    crop: {
      icon: ImageOff,
      title: 'No se pudo cargar el editor de recorte',
      detail:
        'El archivo de imagen pudo no haberse leído correctamente. Intenta seleccionar la imagen de nuevo.',
    },
    frame: {
      icon: ImageOff,
      title: 'Error al mostrar los marcos',
      detail: 'Ocurrió un error al renderizar la vista de marcos. Puedes volver al paso anterior.',
    },
    dropzone: {
      icon: Video,
      title: 'Error en la zona de carga',
      detail:
        'No se pudo inicializar el área de arrastrar y soltar. Intenta recargar la sección.',
    },
    generic: {
      icon: ImageOff,
      title: 'Error en el flujo de subida',
      detail: 'Algo salió mal. Puedes intentar de nuevo o volver al inicio.',
    },
  }

  const { icon: Icon, title, detail } = stepLabels[step]

  return (
    <div className="w-full rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex flex-col items-center gap-4 text-center">
      <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/15">
        <Icon size={22} className="text-destructive/70" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">{detail}</p>
      </div>

      {/* Dev detail (shown only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <p className="text-[10px] font-mono text-destructive/60 bg-background/60 border border-border/40 rounded-lg px-3 py-1.5 max-w-full break-all">
          {error.message}
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
        >
          <RefreshCw size={12} />
          Intentar de nuevo
        </button>
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft size={12} />
            Volver atrás
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Specialized wrappers ────────────────────────────────────────────────────

interface UploadStepBoundaryProps extends Pick<ErrorBoundaryProps, 'onError'> {
  children: ReactNode
  step: 'crop' | 'frame' | 'dropzone' | 'generic'
  /** Optional callback to navigate back (e.g. go to previous photo step) */
  onGoBack?: () => void
}

/**
 * Error Boundary for a specific step inside the upload flow.
 * Wrap each individual section (PhotoCropEditor, FrameSelector, dropzones).
 */
export function UploadStepBoundary({
  children,
  step,
  onGoBack,
  onError,
}: UploadStepBoundaryProps) {
  return (
    <ErrorBoundary
      label={`el paso de ${step}`}
      onError={onError}
      fallback={(error, reset) => (
        <UploadFallbackUI error={error} reset={reset} step={step} onGoBack={onGoBack} />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Top-level Error Boundary for the entire upload flow section.
 * If something breaks outside a step (state inconsistency, etc.),
 * this catches it before it takes down the whole page.
 */
export function UploadFlowBoundary({
  children,
  onError,
}: {
  children: ReactNode
  onError?: ErrorBoundaryProps['onError']
}) {
  return (
    <ErrorBoundary label="el flujo de subida" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}
