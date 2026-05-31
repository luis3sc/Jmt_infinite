'use client'

import { MapPin, RefreshCw, Wifi } from 'lucide-react'
import { ErrorBoundary, type ErrorBoundaryProps } from '@/components/ui/ErrorBoundary'
import type { ReactNode } from 'react'

// ─── Map-specific fallback UI ────────────────────────────────────────────────

function MapFallback({ error, reset }: { error: Error; reset: () => void }) {
  // Detectar si es error de red/tiles para dar mensaje más preciso
  const isNetworkError =
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('fetch') ||
    error.message.toLowerCase().includes('load')

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-5 rounded-card border border-border/50 bg-card/40 backdrop-blur-sm">
      {/* Icon group */}
      <div className="relative">
        <div className="p-4 rounded-card bg-muted/50 border border-border/40">
          <MapPin size={32} className="text-muted-foreground/50" />
        </div>
        {isNetworkError && (
          <div className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive/90">
            <Wifi size={10} className="text-white" />
          </div>
        )}
      </div>

      {/* Message */}
      <div className="text-center space-y-1.5 max-w-xs px-4">
        <p className="text-sm font-bold text-foreground">
          {isNetworkError ? 'Sin conexión al mapa' : 'El mapa no pudo cargarse'}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isNetworkError
            ? 'Verifica tu conexión a internet y vuelve a intentarlo.'
            : 'Ocurrió un error al renderizar el mapa. Los datos de estructuras siguen disponibles.'}
        </p>
      </div>

      {/* Retry */}
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 cursor-pointer"
      >
        <RefreshCw size={13} />
        Recargar mapa
      </button>
    </div>
  )
}

// ─── Export ──────────────────────────────────────────────────────────────────

interface MapErrorBoundaryProps extends Pick<ErrorBoundaryProps, 'onError'> {
  children: ReactNode
}

export function MapErrorBoundary({ children, onError }: MapErrorBoundaryProps) {
  return (
    <ErrorBoundary
      label="el mapa"
      onError={onError}
      fallback={(error, reset) => <MapFallback error={error} reset={reset} />}
    >
      {children}
    </ErrorBoundary>
  )
}
