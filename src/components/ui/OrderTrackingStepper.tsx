'use client'

import { motion } from 'framer-motion'
import {
  CreditCard,
  Upload,
  ShieldCheck,
  CalendarClock,
  Tv2,
  CheckCircle2,
  Circle,
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
  label: string
  sublabel: string
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
  {
    id: 0,
    label: 'Pago confirmado',
    sublabel: 'Tu reserva está asegurada',
    icon: CreditCard,
  },
  {
    id: 1,
    label: 'Contenido recibido',
    sublabel: 'Video o imagen subida',
    icon: Upload,
  },
  {
    id: 2,
    label: 'En revisión técnica',
    sublabel: 'Validación de formato y contenido',
    icon: ShieldCheck,
  },
  {
    id: 3,
    label: 'Programado',
    sublabel: 'En playlist de la pantalla',
    icon: CalendarClock,
  },
  {
    id: 4,
    label: '¡Al aire!',
    sublabel: 'Tu campaña está en vivo',
    icon: Tv2,
  },
]

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
    'relative flex items-center justify-center w-9 h-9 rounded-full shrink-0 ring-2 transition-all duration-300'

  const nodeStyles: Record<StepState, string> = {
    completed: 'bg-primary ring-primary/30 text-white shadow-lg shadow-primary/25',
    active:    'bg-background ring-primary text-primary',
    pending:   'bg-muted ring-border/50 text-muted-foreground/40',
    rejected:  'bg-red-500/10 ring-red-500/40 text-red-500',
  }

  return (
    <div className={cn(nodeBase, nodeStyles[state])}>
      {state === 'completed' ? (
        <CheckCircle2 size={18} className="text-white" />
      ) : state === 'rejected' ? (
        <AlertCircle size={18} />
      ) : state === 'active' ? (
        <>
          <Icon size={16} />
          {/* Pulse ring for active state */}
          <span className="absolute inset-0 rounded-full ring-2 ring-primary/20 animate-ping" />
        </>
      ) : (
        <Icon size={16} />
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
        const isLast = i === steps.length - 1

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="flex gap-3"
          >
            {/* Left column: node + connector */}
            <div className="flex flex-col items-center">
              <StepNode step={step} state={state} />
              {!isLast && (
                <div
                  className={cn(
                    'w-px flex-1 my-1 min-h-[24px] transition-colors duration-500',
                    step.id < activeStep ? 'bg-primary/40' : 'bg-border/50'
                  )}
                />
              )}
            </div>

            {/* Right column: text */}
            <div className={cn('pb-5', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-xs font-bold leading-none mb-0.5 transition-colors duration-300',
                  state === 'completed' || state === 'active'
                    ? 'text-foreground'
                    : 'text-muted-foreground/50',
                  state === 'rejected' && 'text-red-500'
                )}
              >
                {step.label}
                {state === 'rejected' && (
                  <span className="ml-1.5 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                    Rechazado
                  </span>
                )}
              </p>
              <p
                className={cn(
                  'text-[10px] leading-tight',
                  state === 'active'
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground/40'
                )}
              >
                {state === 'active' ? '● En curso' : step.sublabel}
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
                  'text-[10px] font-bold text-center leading-tight transition-colors duration-300 px-1',
                  state === 'completed' || state === 'active'
                    ? 'text-foreground'
                    : 'text-muted-foreground/40',
                  state === 'rejected' && 'text-red-500'
                )}
              >
                {step.label}
              </p>
              {state === 'active' && (
                <span className="text-[9px] text-primary font-black uppercase tracking-wide">
                  En curso
                </span>
              )}
              {state === 'rejected' && (
                <span className="text-[9px] text-red-500 font-black uppercase tracking-wide">
                  Rechazado
                </span>
              )}
            </motion.div>

            {/* Connector */}
            {!isLast && (
              <div className="flex-1 h-px mt-[18px] mx-1 transition-colors duration-500"
                style={{
                  background: step.id < activeStep
                    ? 'hsl(var(--primary) / 0.4)'
                    : 'hsl(var(--border) / 0.5)',
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

  return (
    <div className={cn('w-full', className)}>
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
  )
}
