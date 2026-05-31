'use client'

import { useState, useTransition } from 'react'
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Building2,
  User,
  FileText,
  MessageSquareWarning,
  Loader2,
  ClipboardCopy,
  Phone,
  Mail,
  MapPin,
  Hash,
  ShieldCheck,
} from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type FormData = {
  reclamante_nombre: string
  reclamante_tipo_doc: 'DNI' | 'CE' | 'RUC' | 'PASAPORTE'
  reclamante_num_doc: string
  reclamante_domicilio: string
  reclamante_telefono: string
  reclamante_email: string
  tipo_bien: 'producto' | 'servicio'
  descripcion_servicio: string
  monto_reclamado: string
  tipo_disconformidad: 'reclamo' | 'queja'
  detalle_reclamo: string
  pedido_consumidor: string
}

const INITIAL_FORM: FormData = {
  reclamante_nombre: '',
  reclamante_tipo_doc: 'DNI',
  reclamante_num_doc: '',
  reclamante_domicilio: '',
  reclamante_telefono: '',
  reclamante_email: '',
  tipo_bien: 'servicio',
  descripcion_servicio: '',
  monto_reclamado: '',
  tipo_disconformidad: 'reclamo',
  detalle_reclamo: '',
  pedido_consumidor: '',
}

// ─── Constantes de la empresa ─────────────────────────────────────────────────

const EMPRESA = {
  razon_social: 'JMT OUTDOORS S.A.C.',
  nombre_comercial: 'JMT OUTDOORS',
  ruc: '20612345678', // Reemplaza con RUC real
  domicilio: 'Av. Javier Prado Este 123, San Isidro, Lima, Perú',
  email: 'soporte@jmtoutdoors.com.pe',
  telefono: '+51 1 234-5678',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border">
      <div className="p-1.5 bg-primary/10 rounded-input text-primary shrink-0">
        <Icon size={16} />
      </div>
      <h3 className="text-sm font-bold text-card-foreground uppercase tracking-wider">{label}</h3>
    </div>
  )
}

function InputField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground/80">{hint}</p>}
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  )
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-card border border-border rounded-input text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200'

const selectClass =
  'w-full px-3.5 py-2.5 bg-card border border-border rounded-input text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200 appearance-none cursor-pointer'

const textareaClass =
  'w-full px-3.5 py-2.5 bg-card border border-border rounded-input text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200 resize-none min-h-[100px]'

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LibroReclamacionesPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<{ numero_reclamo: string; fecha: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const set = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  // ── Validación ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: Partial<FormData> = {}

    if (!form.reclamante_nombre.trim()) newErrors.reclamante_nombre = 'Nombre completo requerido'
    if (!form.reclamante_num_doc.trim()) newErrors.reclamante_num_doc = 'Número de documento requerido'
    if (!form.reclamante_domicilio.trim()) newErrors.reclamante_domicilio = 'Domicilio requerido'
    if (!form.reclamante_telefono.trim()) newErrors.reclamante_telefono = 'Teléfono requerido'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.reclamante_email.trim()) {
      newErrors.reclamante_email = 'Correo electrónico requerido'
    } else if (!emailRegex.test(form.reclamante_email)) {
      newErrors.reclamante_email = 'Formato de correo inválido'
    }

    if (!form.descripcion_servicio.trim()) newErrors.descripcion_servicio = 'Descripción del servicio requerida'
    if (!form.detalle_reclamo.trim()) newErrors.detalle_reclamo = 'Detalle del reclamo requerido'
    if (form.detalle_reclamo.trim().length < 30) newErrors.detalle_reclamo = 'Describe el problema con más detalle (mín. 30 caracteres)'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    startTransition(async () => {
      try {
        const payload = {
          ...form,
          monto_reclamado: form.monto_reclamado ? Number(form.monto_reclamado) : null,
        }

        const res = await fetch('/api/reclamos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok) {
          setSubmitError(data.error ?? 'Ocurrió un error. Intente nuevamente.')
          return
        }

        setResult({ numero_reclamo: data.numero_reclamo, fecha: data.fecha })
      } catch {
        setSubmitError('Error de conexión. Por favor intente nuevamente.')
      }
    })
  }

  function copyToClipboard() {
    if (!result) return
    navigator.clipboard.writeText(result.numero_reclamo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Pantalla de confirmación ──────────────────────────────────────────────

  if (result) {
    const fecha = new Date(result.fecha).toLocaleDateString('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const hora = new Date(result.fecha).toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit',
    })

    return (
      <article className="space-y-8">
        <div className="flex flex-col items-center text-center py-8 space-y-6">
          {/* Ícono de éxito */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-[scaleIn_0.4s_ease-out]">
              <CheckCircle2 className="text-green-600" size={44} />
            </div>
            <div className="absolute -inset-3 rounded-full border-2 border-green-200/60 animate-ping" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground">
              Reclamo Registrado
            </h1>
            <p className="text-muted-foreground max-w-md">
              Su reclamo ha sido registrado exitosamente en el Libro de Reclamaciones Virtual de{' '}
              <strong className="text-foreground">{EMPRESA.nombre_comercial}</strong>.
            </p>
          </div>

          {/* Número de reclamo */}
          <div className="w-full max-w-sm bg-muted/40 border-2 border-dashed border-primary/30 rounded-card p-6 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              N° de Código de Reclamo
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-black text-primary tracking-tighter font-mono">
                {result.numero_reclamo}
              </span>
              <button
                onClick={copyToClipboard}
                title="Copiar código"
                className="p-2 rounded-button bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer"
              >
                <ClipboardCopy size={18} />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 font-semibold animate-pulse">
                ✓ Código copiado al portapapeles
              </p>
            )}
            <p className="text-xs text-muted-foreground/80">
              Registrado el {fecha} a las {hora}
            </p>
          </div>

          {/* Información de seguimiento */}
          <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <ShieldCheck size={14} /> Próximos pasos
            </p>
            <ul className="text-xs text-amber-700 space-y-1.5 list-disc list-inside">
              <li>Guarda tu número de reclamo como referencia.</li>
              <li>Recibirás una respuesta en un plazo máximo de <strong>15 días hábiles</strong>.</li>
              <li>La respuesta será enviada al correo que registraste.</li>
              <li>Si no recibes respuesta, puedes acudir al INDECOPI.</li>
            </ul>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <button
              onClick={() => { setResult(null); setForm(INITIAL_FORM) }}
              className="flex-1 px-4 py-2.5 border border-border rounded-button text-sm font-semibold text-muted-foreground hover:bg-muted transition-all cursor-pointer"
            >
              Nuevo reclamo
            </button>
            <a
              href="/"
              className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-button text-sm font-semibold text-center hover:bg-primary/90 transition-all"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </article>
    )
  }

  // ── Formulario principal ──────────────────────────────────────────────────

  return (
    <article className="space-y-8">

      {/* ── Encabezado ── */}
      <header className="border-b border-border pb-6 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-input text-primary">
            <BookOpen size={24} />
          </div>
          <p className="text-sm text-primary font-semibold uppercase tracking-wider">
            Ley N° 29571 — Código de Protección al Consumidor
          </p>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2">
          Libro de Reclamaciones Virtual
        </h1>
        <p className="text-xs text-muted-foreground/80">
          Establecimiento Virtual · {EMPRESA.nombre_comercial} ({EMPRESA.razon_social})
        </p>
      </header>

      {/* ── Sección 0: Datos de la Empresa ── */}
      <section className="bg-muted/40 border border-border/60 rounded-card p-5 md:p-6">
        <SectionHeader icon={Building2} label="I. Datos del Proveedor" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-foreground">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Razón Social</span>
            <span className="font-semibold">{EMPRESA.razon_social}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Nombre Comercial</span>
            <span className="font-semibold">{EMPRESA.nombre_comercial}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">RUC</span>
            <span className="font-semibold">{EMPRESA.ruc}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Domicilio Fiscal</span>
            <span className="font-semibold">{EMPRESA.domicilio}</span>
          </div>
        </div>
      </section>

      {/* ── Formulario ── */}
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>

        {/* ── Sección 1: Datos del Reclamante ── */}
        <section className="bg-card border border-border/80 rounded-card p-5 md:p-6 shadow-sm">
          <SectionHeader icon={User} label="II. Datos del Reclamante" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div className="sm:col-span-2">
              <InputField label="Nombre Completo / Razón Social" required error={errors.reclamante_nombre}>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Ej. Juan Carlos Pérez García"
                    className={`${inputClass} pl-9`}
                    value={form.reclamante_nombre}
                    onChange={e => set('reclamante_nombre', e.target.value)}
                  />
                </div>
              </InputField>
            </div>

            <InputField label="Tipo de Documento" required>
              <div className="relative">
                <select
                  className={selectClass}
                  value={form.reclamante_tipo_doc}
                  onChange={e => set('reclamante_tipo_doc', e.target.value as FormData['reclamante_tipo_doc'])}
                >
                  <option value="DNI">DNI — Documento Nacional de Identidad</option>
                  <option value="CE">CE — Carné de Extranjería</option>
                  <option value="RUC">RUC — Registro Único de Contribuyentes</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
                <ChevronRight size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
              </div>
            </InputField>

            <InputField label="N° de Documento" required error={errors.reclamante_num_doc}>
              <div className="relative">
                <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={form.reclamante_tipo_doc === 'DNI' ? '12345678' : 'Número de documento'}
                  className={`${inputClass} pl-9`}
                  value={form.reclamante_num_doc}
                  onChange={e => set('reclamante_num_doc', e.target.value)}
                  maxLength={form.reclamante_tipo_doc === 'DNI' ? 8 : form.reclamante_tipo_doc === 'RUC' ? 11 : 20}
                />
              </div>
            </InputField>

            <div className="sm:col-span-2">
              <InputField label="Domicilio" required error={errors.reclamante_domicilio} hint="Incluya calle, número, distrito y ciudad">
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Ej. Av. Los Álamos 456, Miraflores, Lima"
                    className={`${inputClass} pl-9`}
                    value={form.reclamante_domicilio}
                    onChange={e => set('reclamante_domicilio', e.target.value)}
                  />
                </div>
              </InputField>
            </div>

            <InputField label="Teléfono / Celular" required error={errors.reclamante_telefono}>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ej. 987654321"
                  className={`${inputClass} pl-9`}
                  value={form.reclamante_telefono}
                  onChange={e => set('reclamante_telefono', e.target.value)}
                />
              </div>
            </InputField>

            <InputField label="Correo Electrónico" required error={errors.reclamante_email}>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Ej. reclamante@correo.com"
                  className={`${inputClass} pl-9`}
                  value={form.reclamante_email}
                  onChange={e => set('reclamante_email', e.target.value)}
                />
              </div>
            </InputField>

          </div>
        </section>

        {/* ── Sección 2: Identificación del Bien / Servicio ── */}
        <section className="bg-card border border-border/80 rounded-card p-5 md:p-6 shadow-sm">
          <SectionHeader icon={FileText} label="III. Identificación del Bien o Servicio" />
          <div className="space-y-5">

            {/* Tipo: Producto o Servicio */}
            <InputField label="Tipo de Disconformidad sobre" required>
              <div className="grid grid-cols-2 gap-3">
                {(['producto', 'servicio'] as const).map(tipo => (
                  <label
                    key={tipo}
                    className={`flex items-center justify-center gap-2 p-3 rounded-input border-2 cursor-pointer transition-all duration-200 font-semibold text-sm capitalize
                      ${form.tipo_bien === tipo
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted'
                      }`}
                  >
                    <input
                      type="radio"
                      name="tipo_bien"
                      value={tipo}
                      checked={form.tipo_bien === tipo}
                      onChange={() => set('tipo_bien', tipo)}
                      className="hidden"
                    />
                    {tipo === 'producto' ? '📦 Producto' : '🖥️ Servicio'}
                  </label>
                ))}
              </div>
            </InputField>

            <InputField label="Descripción del Bien o Servicio" required error={errors.descripcion_servicio} hint="Ej: Servicio de publicidad en pantalla LED digital, conversión de video para DOOH">
              <textarea
                placeholder="Describa el bien o servicio adquirido..."
                className={textareaClass}
                rows={3}
                value={form.descripcion_servicio}
                onChange={e => set('descripcion_servicio', e.target.value)}
              />
            </InputField>

            <InputField label="Monto Reclamado (S/)" hint="Opcional — Monto en soles que involucra el reclamo">
              <input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.monto_reclamado}
                onChange={e => set('monto_reclamado', e.target.value)}
              />
            </InputField>

          </div>
        </section>

        {/* ── Sección 3: Detalle de la Reclamación ── */}
        <section className="bg-card border border-border/80 rounded-card p-5 md:p-6 shadow-sm">
          <SectionHeader icon={MessageSquareWarning} label="IV. Detalle de la Reclamación" />
          <div className="space-y-5">

            {/* Tipo de disconformidad: Reclamo vs Queja */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tipo <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`relative flex flex-col gap-1.5 p-4 rounded-input border-2 cursor-pointer transition-all duration-200
                    ${form.tipo_disconformidad === 'reclamo'
                      ? 'border-red-400 bg-red-500/5 text-red-500'
                      : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted'
                    }`}
                >
                  <input
                    type="radio"
                    name="tipo_disconformidad"
                    value="reclamo"
                    checked={form.tipo_disconformidad === 'reclamo'}
                    onChange={() => set('tipo_disconformidad', 'reclamo')}
                    className="hidden"
                  />
                  <span className="font-bold text-sm">⚠️ Reclamo</span>
                  <span className="text-xs leading-relaxed opacity-80">
                    Disconformidad relacionada directamente con el bien o servicio adquirido (ej. el video se renderizó con errores de formato).
                  </span>
                  {form.tipo_disconformidad === 'reclamo' && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </label>

                <label
                  className={`relative flex flex-col gap-1.5 p-4 rounded-input border-2 cursor-pointer transition-all duration-200
                    ${form.tipo_disconformidad === 'queja'
                      ? 'border-amber-400 bg-amber-500/5 text-amber-500'
                      : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted'
                    }`}
                >
                  <input
                    type="radio"
                    name="tipo_disconformidad"
                    value="queja"
                    checked={form.tipo_disconformidad === 'queja'}
                    onChange={() => set('tipo_disconformidad', 'queja')}
                    className="hidden"
                  />
                  <span className="font-bold text-sm">💬 Queja</span>
                  <span className="text-xs leading-relaxed opacity-80">
                    Malestar por la atención al cliente o el proceso de compra (no directamente sobre el servicio en sí).
                  </span>
                  {form.tipo_disconformidad === 'queja' && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full" />
                  )}
                </label>
              </div>
            </div>

            <InputField
              label="Detalle de la Disconformidad"
              required
              error={errors.detalle_reclamo}
              hint="Describa con precisión qué ocurrió, cuándo y cuál fue el impacto (mín. 30 caracteres)"
            >
              <textarea
                placeholder="Ejemplo: El día 15 de mayo de 2026, reservé una campaña publicitaria en pantalla LED ubicada en... Sin embargo, al revisar el Proof of Play, noté que..."
                className={textareaClass}
                rows={5}
                value={form.detalle_reclamo}
                onChange={e => set('detalle_reclamo', e.target.value)}
              />
              <p className="text-xs text-muted-foreground/80 text-right mt-1">
                {form.detalle_reclamo.length} / 30 mín.
              </p>
            </InputField>

            <InputField label="Pedido del Consumidor" hint="Opcional — ¿Qué solución espera recibir de parte de JMT Outdoors?">
              <textarea
                placeholder="Ej: Solicito la devolución del monto pagado por la campaña, o la reprogramación sin costo adicional."
                className={textareaClass}
                rows={3}
                value={form.pedido_consumidor}
                onChange={e => set('pedido_consumidor', e.target.value)}
              />
            </InputField>

          </div>
        </section>

        {/* ── Aviso legal ── */}
        <div className="bg-muted/40 border border-border rounded-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground font-semibold">Declaración del reclamante:</p>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Declaro que los datos proporcionados son verídicos y que el presente reclamo está sustentado en hechos reales.
            Autorizo a <strong>{EMPRESA.razon_social}</strong> a tratar mis datos personales para la gestión de este reclamo,
            conforme a la Ley N° 29733 (Ley de Protección de Datos Personales del Perú).
            La formulación de este reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo
            para interponer una denuncia ante el <strong>INDECOPI</strong>.
          </p>
        </div>

        {/* ── Error global ── */}
        {submitError && (
          <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-card p-4 text-red-500">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{submitError}</p>
          </div>
        )}

        {/* ── Botón de envío ── */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 px-6 bg-primary text-primary-foreground font-bold text-sm rounded-button hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Registrando reclamo...
            </>
          ) : (
            <>
              <BookOpen size={18} />
              Registrar Reclamo Formalmente
            </>
          )}
        </button>

        {/* ── Nota de plazo ── */}
        <p className="text-center text-xs text-muted-foreground/80 italic">
          ⏱ JMT Outdoors dará respuesta en un plazo no mayor a <strong className="text-muted-foreground">15 días hábiles</strong> improrrogables conforme a la ley.
        </p>

      </form>
    </article>
  )
}
