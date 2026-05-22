'use client'

import { motion } from 'framer-motion'
import {
  CreditCard,
  Upload,
  ShieldCheck,
  CalendarClock,
  Tv2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING_UPLOAD'
  | 'VIDEO_SENT'
  | 'PENDING_VALIDATION'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'

type StepState = 'completed' | 'active' | 'pending' | 'rejected'

interface Step {
  id: number
  icon: React.ElementType
}

interface OrderTrackingStepperProps {
  status: OrderStatus
  /** 'vertical' forces timeline layout (mobile). 'auto' picks vertical on mobile, horizontal on desktop */
  layout?: 'auto' | 'vertical'
  className?: string
}

// ─── Step Definitions ─────────────────────────────────────────────────────────

const STEPS: Step[] = [
  { id: 0, icon: CreditCard },
  { id: 1, icon: Upload },
  { id: 2, icon: ShieldCheck },
  { id: 3, icon: CalendarClock },
  { id: 4, icon: Tv2 },
]

// ─── Dynamic Copy Generator ──────────────────────────────────────────────────
// Returns Peruvian-friendly Spanish copy for steps, based on their dynamic state.
// Avoids OOH/DOOH acronyms and technical jargon.
function getStepText(stepId: number, state: StepState): { label: string; sublabel: string } {
  switch (stepId) {
    case 0:
      return {
        label: 'Pago confirmado',
        sublabel: 'Tu reserva está 100% asegurada',
      }
    case 1:
      if (state === 'completed') {
        return {
          label: 'Foto o video recibido',
          sublabel: 'Ya tenemos tu diseño cargado',
        }
      } else if (state === 'active') {
        return {
          label: '👉 Sube tu foto o video',
          sublabel: 'Por favor, ingresa tu diseño aquí abajo',
        }
      } else {
        return {
          label: 'Foto o video',
          sublabel: 'Pendiente de subir',
        }
      }
    case 2:
      if (state === 'completed') {
        return {
          label: 'Diseño aprobado',
          sublabel: 'Cumple con todas las medidas',
        }
      } else if (state === 'active') {
        return {
          label: '🔎 Revisando tu diseño',
          sublabel: 'Cuidamos que se vea perfecto en la calle',
        }
      } else if (state === 'rejected') {
        return {
          label: '❌ Diseño observado',
          sublabel: 'Tiene un detalle por corregir. Escríbenos por WhatsApp',
        }
      } else {
        return {
          label: 'Revisión de tu anuncio',
          sublabel: 'Verificaremos que las medidas sean correctas',
        }
      }
    case 3:
      if (state === 'completed') {
        return {
          label: 'Listo en pantalla',
          sublabel: 'Programado para salir en las avenidas',
        }
      } else if (state === 'active') {
        return {
          label: '⏳ Programando pantalla',
          sublabel: 'Ingresando tu anuncio a la cola de la pantalla gigante',
        }
      } else {
        return {
          label: 'Programación',
          sublabel: 'Preparando la pantalla gigante para tu anuncio',
        }
      }
    case 4:
      if (state === 'active' || state === 'completed') {
        return {
          label: '🎉 ¡Al aire en la calle!',
          sublabel: 'Tu anuncio ya se muestra en la pantalla gigante',
        }
      } else {
        return {
          label: '¡Al aire!',
          sublabel: 'Se mostrará en la pantalla de la avenida',
        }
      }
    default:
      return { label: '', sublabel: '' }
  }
}

// Generates simple, warm, and highly visible summary text for the current status.
function getHeroStatusText(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_UPLOAD':
      return 'Esperando que subas tu foto o video aquí abajo para continuar.'
    case 'VIDEO_SENT':
    case 'PENDING_VALIDATION':
      return 'Estamos revisando que tu diseño cumpla con las medidas para que se vea excelente en la calle.'
    case 'REJECTED':
      return 'Tu anuncio tiene un detalle por corregir. No te preocupes, dale clic al botón rojo de abajo para subir otro.'
    case 'CONFIRMED':
      return '¡Felicidades! Tu anuncio ya se muestra en vivo en la pantalla gigante.'
    case 'CANCELLED':
      return 'Este pedido ha sido cancelado.'
    default:
      return 'Estamos procesando tu pedido de forma 100% segura.'
  }
}

// ─── Map DB status → active step index ────────────────────────────────────────

function resolveActiveStep(status: OrderStatus): number {
  switch (status) {
    case 'PENDING_UPLOAD': return 1   // waiting for content upload
    case 'VIDEO_SENT':     return 2   // content received, now in review
    case 'PENDING_VALIDATION': return 2
    case 'REJECTED':       return 2   // stuck at review (rejected)
    case 'CONFIRMED':      return 4   // live!
    default:               return 1
  }
}

function getStepState(stepId: number, activeStep: number, isRejected: boolean): StepState {
  if (stepId === 2 && isRejected) return 'rejected'
  if (stepId < activeStep) return 'completed'
  if (stepId === activeStep) return 'active'
  return 'pending'
}

// ─── Step Node ─────────────────────────────────────────────────────────────────

function StepNode({ step, state }: { step: Step; state: StepState }) {
  const Icon = step.icon

  const nodeBase =
    'relative flex items-center justify-center w-10 h-10 rounded-full shrink-0 ring-2 transition-all duration-300'

  const nodeStyles: Record<StepState, string> = {
    completed: 'bg-primary ring-primary/30 text-primary-foreground shadow-lg shadow-primary/25',
    active:    'bg-background ring-primary text-primary',
    pending:   'bg-muted ring-border/50 text-muted-foreground/70',
    rejected:  'bg-red-500/10 ring-red-500/40 text-red-500',
  }

  return (
    <div className={cn(nodeBase, nodeStyles[state])}>
      {state === 'completed' ? (
        <CheckCircle2 size={20} className="text-white" />
      ) : state === 'rejected' ? (
        <AlertCircle size={20} />
      ) : state === 'active' ? (
        <>
          <Icon size={18} />
          {/* Pulse ring for active state */}
          <span className="absolute inset-0 rounded-full ring-2 ring-primary/20 animate-ping" />
        </>
      ) : (
        <Icon size={18} />
      )}
    </div>
  )
}

// ─── Vertical Timeline (Mobile) ────────────────────────────────────────────────

function VerticalStepper({
  steps,
  activeStep,
  isRejected,
}: {
  steps: Step[]
  activeStep: number
  isRejected: boolean
}) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const state = getStepState(step.id, activeStep, isRejected)
        const { label, sublabel } = getStepText(step.id, state)
        const isLast = i === steps.length - 1

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="flex gap-4"
          >
            {/* Left column: node + connector */}
            <div className="flex flex-col items-center">
              <StepNode step={step} state={state} />
              {!isLast && (
                <div
                  className={cn(
                    'w-[2.5px] flex-1 my-1.5 min-h-[28px] transition-colors duration-500',
                    step.id < activeStep ? 'bg-primary' : 'bg-border/60'
                  )}
                />
              )}
            </div>

            {/* Right column: text */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-bold leading-tight mb-1 transition-colors duration-300 flex items-center gap-1.5',
                  state === 'completed' || state === 'active'
                    ? 'text-foreground'
                    : 'text-muted-foreground/80',
                  state === 'rejected' && 'text-red-500'
                )}
              >
                {label}
                {state === 'rejected' && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                    Observado
                  </span>
                )}
              </p>
              <p
                className={cn(
                  'text-xs leading-normal',
                  state === 'active'
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground/60'
                )}
              >
                {sublabel}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Horizontal Stepper (Desktop) ──────────────────────────────────────────────

function HorizontalStepper({
  steps,
  activeStep,
  isRejected,
}: {
  steps: Step[]
  activeStep: number
  isRejected: boolean
}) {
  return (
    <div className="flex items-start w-full">
      {steps.map((step, i) => {
        const state = getStepState(step.id, activeStep, isRejected)
        const { label, sublabel } = getStepText(step.id, state)
        const isLast = i === steps.length - 1

        return (
          <div key={step.id} className="flex items-start flex-1 min-w-0">
            {/* Step block */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex flex-col items-center gap-2 flex-1 min-w-0"
            >
              <StepNode step={step} state={state} />
              
              <p
                className={cn(
                  'text-xs font-bold text-center leading-tight transition-colors duration-300 px-1',
                  state === 'completed' || state === 'active'
                    ? 'text-foreground'
                    : 'text-muted-foreground/80',
                  state === 'rejected' && 'text-red-500'
                )}
              >
                {label}
              </p>

              <p
                className={cn(
                  'text-[10px] text-center leading-normal transition-colors duration-300 px-2 mt-0.5 hidden sm:block',
                  state === 'active'
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground/60'
                )}
              >
                {sublabel}
              </p>

              {state === 'active' && (
                <span className="text-[9px] text-primary font-black uppercase tracking-wide bg-primary/10 px-1.5 py-0.5 rounded mt-1">
                  En curso
                </span>
              )}
              {state === 'rejected' && (
                <span className="text-[9px] text-red-500 font-black uppercase tracking-wide bg-red-500/10 px-1.5 py-0.5 rounded mt-1">
                  Observado
                </span>
              )}
            </motion.div>

            {/* Connector */}
            {!isLast && (
              <div className="flex-1 h-[2.5px] mt-[18px] mx-1 transition-colors duration-500"
                style={{
                  background: step.id < activeStep
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--border) / 0.8)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export function OrderTrackingStepper({
  status,
  layout = 'auto',
  className,
}: OrderTrackingStepperProps) {
  const activeStep = resolveActiveStep(status)
  const isRejected = status === 'REJECTED'
  const heroText = getHeroStatusText(status)

  return (
    <div className={cn('w-full space-y-5', className)}>
      {/* Hero Status Badge */}
      <div className={cn(
        "p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-3 shadow-sm transition-all duration-300",
        status === 'PENDING_UPLOAD' && "bg-amber-500/10 border-amber-500/20 text-amber-500",
        (status === 'VIDEO_SENT' || status === 'PENDING_VALIDATION') && "bg-blue-500/10 border-blue-500/20 text-blue-400",
        status === 'REJECTED' && "bg-red-500/10 border-red-500/20 text-red-500",
        status === 'CONFIRMED' && "bg-primary/10 border-primary/20 text-primary",
        status === 'CANCELLED' && "bg-muted border-border/50 text-muted-foreground"
      )}>
        <span className="shrink-0 text-base">📌</span>
        <p className="leading-relaxed">
          <strong className="uppercase tracking-wider mr-1 text-[10px] opacity-90">Estado actual:</strong> {heroText}
        </p>
      </div>

      {/* Stepper Timeline UI */}
      <div className="p-4 rounded-xl bg-card border border-border/50 shadow-inner">
        {/* Vertical — always visible on mobile, hidden on desktop when layout=auto */}
        <div className={layout === 'auto' ? 'md:hidden' : undefined}>
          <VerticalStepper steps={STEPS} activeStep={activeStep} isRejected={isRejected} />
        </div>

        {/* Horizontal — only on desktop when layout=auto */}
        {layout === 'auto' && (
          <div className="hidden md:block">
            <HorizontalStepper steps={STEPS} activeStep={activeStep} isRejected={isRejected} />
          </div>
        )}
      </div>
    </div>
  )
}
