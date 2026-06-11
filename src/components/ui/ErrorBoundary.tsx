'use client'

import React, { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback UI. Receives error + reset function */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Called when an error is caught — hook for logging/Sentry */
  onError?: (error: Error, info: ErrorInfo) => void
  /** Label shown in the fallback card (e.g. "el editor de foto") */
  label?: string
  /** If true, renders a compact inline fallback instead of a full card */
  inline?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  showDetails: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, showDetails: false }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Always log to console for dev visibility
    console.error('[ErrorBoundary] Caught error:', error, info)
    // Call optional external reporter (Sentry, PostHog, etc.)
    this.props.onError?.(error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null, showDetails: false })
  }

  toggleDetails = () => {
    this.setState((s) => ({ showDetails: !s.showDetails }))
  }

  render() {
    const { hasError, error, showDetails } = this.state
    const { children, fallback, label = 'este componente', inline } = this.props

    if (!hasError || !error) return children

    // Custom fallback provided by parent
    if (fallback) return fallback(error, this.reset)

    // Inline compact fallback
    if (inline) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
          <AlertTriangle size={13} />
          <span>Ocurrió un error en {label}.</span>
          <button
            onClick={this.reset}
            className="ml-auto flex items-center gap-1 hover:opacity-70 transition-opacity font-bold"
          >
            <RefreshCw size={11} />
            Reintentar
          </button>
        </div>
      )
    }

    // Default full-card fallback
    return (
      <div className="w-full rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex flex-col items-center gap-4 text-center shadow-sm">
        {/* Icon */}
        <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/15">
          <AlertTriangle size={24} className="text-destructive" />
        </div>

        {/* Message */}
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">
            Algo salió mal con {label}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
            No te preocupes, el resto de la página sigue funcionando. Puedes
            intentar de nuevo o recargar la página si el problema persiste.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={this.reset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <RefreshCw size={13} />
            Intentar de nuevo
          </button>
          <button
            onClick={this.toggleDetails}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Detalles técnicos
          </button>
        </div>

        {/* Error details (dev/support) */}
        {showDetails && (
          <div className="w-full rounded-xl bg-background/60 border border-border/60 p-3 text-left">
            <p className="text-[10px] font-mono text-destructive/80 break-all leading-relaxed">
              {error.name}: {error.message}
            </p>
            {error.stack && (
              <pre className="mt-2 text-[9px] font-mono text-muted-foreground/60 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-32 overflow-y-auto">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
    )
  }
}

// ─── HOC Convenience Wrapper ─────────────────────────────────────────────────

/**
 * Quick HOC to wrap any component with an ErrorBoundary.
 * Usage: const SafeMap = withErrorBoundary(MapViewClient, { label: 'el mapa' })
 */
export function withErrorBoundary<P extends object>(
  Wrapped: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
) {
  const displayName = Wrapped.displayName ?? Wrapped.name ?? 'Component'

  function WithBoundary(props: P) {
    return (
      <ErrorBoundary {...boundaryProps}>
        <Wrapped {...props} />
      </ErrorBoundary>
    )
  }

  WithBoundary.displayName = `withErrorBoundary(${displayName})`
  return WithBoundary
}
