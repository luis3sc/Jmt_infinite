'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2, Send, Rocket, ShieldCheck, Clock, ArrowLeft, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Area } from 'react-easy-crop'

import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'
import { createClient } from '@/lib/supabase/client'

// Upload sub-components
import { UploadDropzone } from '@/components/upload/UploadDropzone'
import { UploadLoading } from '@/components/upload/UploadLoading'
import { UploadSuccess } from '@/components/upload/UploadSuccess'
import { UploadTypeSelector } from '@/components/upload/UploadTypeSelector'
import { PhotoDropzone } from '@/components/upload/PhotoDropzone'
import { PhotoCropEditor } from '@/components/upload/PhotoCropEditor'
import { FrameSelector, AVAILABLE_FRAMES } from '@/components/upload/FrameSelector'
import type { Frame } from '@/components/upload/FrameSelector'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'

// Libs
import { composeImage } from '@/lib/imageComposer'
import { analyzeVideoFile, isAspectRatioCompatible } from '@/lib/videoAnalyzer'
import { processVideo, imageToVideo } from '@/lib/ffmpegClient'

// ─── Tipos locales ──────────────────────────────────────────────────────────

type ContentType = 'idle' | 'photo' | 'video'
type UploadStatus = 'idle' | 'processing' | 'uploading' | 'success' | 'processing_background' | 'processing_client'

interface Order {
  id: string
  status: string
  video_url: string | null
  rejection_reason?: string | null
  bookings?: any[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VIDEO_SPECS = [
  { label: 'Resolución', val: '1280×720', icon: ShieldCheck },
  { label: 'Duración', val: '7 Seg', icon: Clock },
  { label: 'Formato', val: 'MP4 ', icon: CheckCircle2 },
  { label: 'Peso Máx', val: '100MB', icon: ShieldCheck },
]

const PHOTO_SPECS = [
  { label: 'Resolución', val: '1280×720', icon: ShieldCheck },
  { label: 'Orientación', val: 'Horizontal 16:9', icon: Clock },
  { label: 'Formato', val: 'JPG / PNG', icon: CheckCircle2 },
  { label: 'Peso Máx', val: '100MB', icon: ShieldCheck },
]

function Spec({ label, val, icon: Icon }: { label: string; val: string; icon: typeof ShieldCheck }) {
  return (
    <div className="bg-background/40 border border-border/40 px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl flex items-center gap-1.5 md:gap-2 flex-1 min-w-[45%] md:min-w-0">
      <Icon size={10} className="text-primary/60 md:w-3 md:h-3" />
      <div className="flex flex-col">
        <span className="text-[7px] md:text-[8px] uppercase tracking-wider font-bold text-muted-foreground/60 leading-none">{label}</span>
        <span className="text-[9px] md:text-xs font-bold leading-none mt-0.5">{val}</span>
      </div>
    </div>
  )
}

interface ConsentCheckboxesProps {
  acceptedTerms: boolean
  setAcceptedTerms: (val: boolean) => void
  acceptedNoLogos: boolean
  setAcceptedNoLogos: (val: boolean) => void
  userType: string
}

function ConsentCheckboxes({
  acceptedTerms,
  setAcceptedTerms,
  acceptedNoLogos,
  setAcceptedNoLogos,
  userType,
}: ConsentCheckboxesProps) {
  const getLogosLabel = () => {
    switch (userType) {
      case 'entrepreneur':
        return (
          <>
            Confirmo que el logo y las imágenes que estoy subiendo <span className="text-foreground font-semibold">pertenecen a mi negocio</span>.*
          </>
        )
      case 'influencer':
        return (
          <>
            Confirmo que este material <span className="text-foreground font-semibold">promueve mi propia marca personal o redes</span> y no publicidad de otras empresas.*
          </>
        )
      case 'individual':
      default:
        return (
          <>
            Confirmo que mi foto o video es de uso personal y <span className="text-foreground font-semibold">no contiene logotipos ni marcas de otras empresas</span>.*
          </>
        )
    }
  }

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl p-4 sm:p-5 my-4 space-y-4 shadow-sm relative overflow-hidden group/consent">
      {/* Glow sutil en el fondo del consentimiento */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div className="grid grid-cols-[24px_1fr] items-start gap-3 relative z-10">
        <Checkbox
          id="terms-check"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5"
        />
        <label htmlFor="terms-check" className="text-xs sm:text-sm text-muted-foreground leading-snug cursor-pointer select-none font-medium">
          Acepto las <span className="text-primary font-bold hover:underline">normas de uso y condiciones</span> de las pantallas de JMT.*
        </label>
      </div>

      <div className="grid grid-cols-[24px_1fr] items-start gap-3 relative z-10">
        <Checkbox
          id="logos-check"
          checked={acceptedNoLogos}
          onChange={(e) => setAcceptedNoLogos(e.target.checked)}
          className="mt-0.5"
        />
        <label htmlFor="logos-check" className="text-xs sm:text-sm text-muted-foreground leading-snug cursor-pointer select-none font-medium">
          {getLogosLabel()}
        </label>
      </div>
    </div>
  )
}

function ImportantNote({ userType }: { userType: string }) {
  const getNoteContent = () => {
    switch (userType) {
      case 'entrepreneur':
        return {
          title: '⚠️ REGLAS IMPORTANTES PARA TU NEGOCIO',
          allowed: [
            'El logo, redes y nombre de tu negocio',
            'Fotos de tus propios productos o local comercial',
            'Precios, promociones o llamadas a la acción'
          ],
          forbidden: [
            'Logotipos de marcas famosas ajenas (Coca-Cola, Nike, etc.)',
            'Promoción de tabaco, alcohol, violencia o groserías'
          ]
        }
      case 'influencer':
        return {
          title: '⚠️ REGLAS IMPORTANTES PARA CREADORES',
          allowed: [
            'Tu usuario de redes sociales (ej: @miusuario)',
            'Códigos QR grandes y fáciles de escanear en la calle',
            'Fotos o videos tuyos promoviendo tu canal'
          ],
          forbidden: [
            'Publicidad no autorizada de marcas externas',
            'Groserías, contenido inapropiado o tabaco'
          ]
        }
      case 'individual':
      default:
        return {
          title: '⚠️ REGLAS SÚPER IMPORTANTES',
          allowed: [
            'Fotos tuyas, familiares o con amigos para saludos',
            'Tu nombre, dedicatorias o mensajes de celebración',
            'Tu usuario personal de redes sociales (ej: @miusuario)'
          ],
          forbidden: [
            'Logos comerciales o publicidad de marcas/empresas',
            'Cigarros, alcohol, tabaco, violencia o groserías'
          ]
        }
    }
  }

  const note = getNoteContent()

  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 space-y-3 mt-3 shadow-inner">
      <p className="text-xs font-extrabold text-destructive uppercase tracking-wider flex items-center gap-2">
        {note.title}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {/* Columna de Permitidos */}
        <div className="space-y-2">
          <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest leading-none">
            ✅ Lo que SÍ puedes subir:
          </p>
          <ul className="space-y-1.5">
            {note.allowed.map((item, idx) => (
              <li key={idx} className="text-xs text-muted-foreground font-medium leading-tight flex items-start gap-1.5">
                <span className="text-emerald-500 select-none shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna de Prohibidos */}
        <div className="space-y-2">
          <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-none">
            ❌ Lo que NO está permitido:
          </p>
          <ul className="space-y-1.5">
            {note.forbidden.map((item, idx) => (
              <li key={idx} className="text-xs text-muted-foreground font-medium leading-tight flex items-start gap-1.5">
                <span className="text-rose-500 select-none shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/80 font-semibold leading-relaxed pt-1.5 border-t border-border/40">
        * Si tu anuncio contiene elementos no permitidos, será observado por nuestro equipo y te pediremos cambiarlo.
      </p>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function OrderSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  // Order data
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  // UI flow state
  const [contentType, setContentType] = useState<ContentType>('idle')
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [userType, setUserType] = useState<string>('individual')
  const processingStartTimeRef = useRef<number | null>(null)
  const isImageUploadRef = useRef(false)
  const [panelDetails, setPanelDetails] = useState<{
    resolutionWidth: number | null
    resolutionHeight: number | null
    slotDurationSeconds: number | null
    maxSlots: number | null
    operatingStartTime: string | null
    operatingEndTime: string | null
  } | null>(null)

  const dynamicVideoSpecs = [
    { label: 'Resolución', val: panelDetails?.resolutionWidth && panelDetails?.resolutionHeight ? `${panelDetails.resolutionWidth}×${panelDetails.resolutionHeight}` : '1280×720', icon: ShieldCheck },
    { label: 'Duración', val: panelDetails?.slotDurationSeconds ? `${panelDetails.slotDurationSeconds} Seg` : '7 Seg', icon: Clock },
    { label: 'Formato', val: 'MP4 ', icon: CheckCircle2 },
    { label: 'Peso Máx', val: '100MB', icon: ShieldCheck },
  ]

  const dynamicPhotoSpecs = [
    { label: 'Resolución', val: panelDetails?.resolutionWidth && panelDetails?.resolutionHeight ? `${panelDetails.resolutionWidth}×${panelDetails.resolutionHeight}` : '1280×720', icon: ShieldCheck },
    { label: 'Orientación', val: panelDetails?.resolutionWidth && panelDetails?.resolutionHeight && panelDetails.resolutionWidth < panelDetails.resolutionHeight ? 'Vertical 9:16' : 'Horizontal 16:9', icon: Clock },
    { label: 'Formato', val: 'JPG / PNG', icon: CheckCircle2 },
    { label: 'Peso Máx', val: '100MB', icon: ShieldCheck },
  ]

  const cropAspectRatio = panelDetails?.resolutionWidth && panelDetails?.resolutionHeight
    ? panelDetails.resolutionWidth / panelDetails.resolutionHeight
    : 16 / 9

  // Video flow
  const [videoFile, setVideoFile] = useState<File | null>(null)

  // Photo flow
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoObjectUrl, setPhotoObjectUrl] = useState<string | null>(null)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<Frame>(AVAILABLE_FRAMES[0])
  const [photoStep, setPhotoStep] = useState<'drop' | 'crop' | 'frame'>('drop')
  // Blob preview de la imagen recortada para el FrameSelector
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)

  // Checkboxes de consentimiento obligatorio
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedNoLogos, setAcceptedNoLogos] = useState(false)

  const isUploadingNewRef = useRef(false)

  // Fetch order on mount
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('orders')
          .select(`
            id, status, video_url, user_id, 
            profiles(user_type),
            bookings(
              id,
              panels(
                id,
                panel_code,
                resolution_width,
                resolution_height,
                slot_duration_seconds,
                max_slots,
                operating_start_time,
                operating_end_time
              )
            )
          `)
          .eq('id', orderId)
          .single()

        if (data) {
          const profile = data.profiles as any
          if (profile?.user_type) setUserType(profile.user_type)
          setOrder(data as Order)

          // Extraer especificaciones del primer panel asociado para renderizado dinámico
          const firstBooking = (data.bookings as any[])?.[0]
          const firstPanel = firstBooking?.panels
          if (firstPanel) {
            setPanelDetails({
              resolutionWidth: firstPanel.resolution_width,
              resolutionHeight: firstPanel.resolution_height,
              slotDurationSeconds: firstPanel.slot_duration_seconds,
              maxSlots: firstPanel.max_slots,
              operatingStartTime: firstPanel.operating_start_time,
              operatingEndTime: firstPanel.operating_end_time,
            })
          }

          // Si ya tiene video o ya pasó de PENDING_UPLOAD → mostrar éxito directamente
          // Solo si el estado NO es PENDING_UPLOAD, para evitar estados de éxito falsos tras un error anterior
          if (
            (data.status === 'VIDEO_SENT' ||
              data.status === 'PENDING_VALIDATION' ||
              (data.video_url && data.status !== 'PENDING_UPLOAD')) &&
            data.status !== 'REJECTED'
          ) {
            setUploadStatus('success')
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) fetchOrder()
  }, [orderId])

  // Prevenir navegación accidental durante la subida activa o procesamiento del archivo
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadStatus === 'uploading' || uploadStatus === 'processing_client') {
        e.preventDefault()
        e.returnValue = 'El procesamiento o subida de tu archivo está en progreso. Si sales ahora se cancelará. ¿Seguro que deseas salir?'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [uploadStatus])

  // ── Suscripción en tiempo real al estado de procesamiento del video ────────
  useEffect(() => {
    if (!orderId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          console.log('[realtime] Order updated:', payload.new)
          const updatedOrder = payload.new as Order
          setOrder(prev => prev ? { ...prev, ...updatedOrder } : updatedOrder)

          // Ignorar actualizaciones si hay una subida local activa para evitar estados de éxito falsos (stale status)
          if (isUploadingNewRef.current) {
            console.log('[realtime] Ignorando actualización de estado porque hay una subida local activa.')
            return
          }

          if (updatedOrder.status === 'VIDEO_SENT' && updatedOrder.video_url) {
            setUploadStatus('success')
            setProgress(100)
          } else if (updatedOrder.status === 'PROCESSING_VIDEO') {
            setUploadStatus('processing')
            // Simular un avance visual de procesamiento suave (nunca llega al 100 — lo hace solo VIDEO_SENT)
            setProgress((prev) => {
              if (prev < 70) return prev + 8
              if (prev < 85) return prev + 3
              if (prev < 92) return prev + 1
              return prev // Se queda en 92 esperando VIDEO_SENT
            })
          } else if (updatedOrder.status === 'PENDING_UPLOAD') {
            processingStartTimeRef.current = null
            setUploadStatus('idle')
            setProgress(0)
            if (updatedOrder.rejection_reason) {
              alert(`Error al procesar material: ${updatedOrder.rejection_reason}`)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  // ── Polling Fallback para mayor robustez (por si falla WebSockets o ya terminó antes de suscribirse) ──
  useEffect(() => {
    if (!orderId || uploadStatus !== 'processing') return

    // Registrar el momento en que empieza el procesamiento
    if (!processingStartTimeRef.current) {
      processingStartTimeRef.current = Date.now()
    }

    // Timeout máximo: 90s para video, 45s para imagen
    // En Vercel/serverless, si el proceso FFmpeg se corta antes de actualizar la BD,
    // la UI se quedaría en 90% infinitamente. Este timeout actúa como red de seguridad.
    const MAX_WAIT_MS = isImageUploadRef.current ? 45_000 : 90_000

    console.log('[polling] Activando fallback de consulta de estado cada 3s...')
    const checkStatus = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('orders')
          .select('status, video_url, rejection_reason')
          .eq('id', orderId)
          .single()

        if (error) {
          console.error('[polling] Error al obtener el estado del pedido:', error)
          return
        }

        if (data) {
          console.log('[polling] Estado actual en base de datos:', data.status)

          // Ignorar actualización si hay una subida local activa para evitar estados falsos de éxito antiguo
          if (isUploadingNewRef.current) {
            console.log('[polling] Ignorando actualización de estado porque hay una subida local activa.')
            return
          }

          if (data.status === 'VIDEO_SENT' && data.video_url) {
            console.log('[polling] ¡Éxito detectado! Redirigiendo a pantalla de éxito.')
            processingStartTimeRef.current = null
            setOrder(prev => prev ? { ...prev, status: data.status, video_url: data.video_url } : (data as Order))
            setUploadStatus('success')
            setProgress(100)
          } else if (data.status === 'PROCESSING_VIDEO') {
            setOrder(prev => prev ? { ...prev, status: data.status } : (data as Order))
            // Avanzar el progreso visual poco a poco mientras se procesa (tope 92%)
            setProgress((prev) => {
              if (prev < 70) return prev + 5
              if (prev < 85) return prev + 2
              if (prev < 92) return prev + 0.5
              return prev
            })

            // ── Red de seguridad contra Vercel timeout ─────────────────────
            // Si llevamos más del tiempo máximo en PROCESSING_VIDEO y el status
            // en DB sigue siendo PROCESSING_VIDEO, es probable que el proceso
            // FFmpeg fue cortado por el serverless runtime. Mostramos estado
            // 'processing_background' para informar al usuario que puede cerrar.
            const elapsed = Date.now() - (processingStartTimeRef.current ?? Date.now())
            if (elapsed > MAX_WAIT_MS) {
              console.warn(`[polling] Timeout de ${MAX_WAIT_MS / 1000}s alcanzado. El proceso serverless probablemente fue cortado. Mostrando estado background.`)
              processingStartTimeRef.current = null
              setUploadStatus('processing_background')
            }
          } else if (data.status === 'PENDING_UPLOAD') {
            processingStartTimeRef.current = null
            setOrder(prev => prev ? { ...prev, status: data.status, rejection_reason: data.rejection_reason } : (data as Order))
            setUploadStatus('idle')
            setProgress(0)
            if (data.rejection_reason) {
              alert(`Error al procesar material: ${data.rejection_reason}`)
            }
          }
        }
      } catch (err) {
        console.error('[polling] Error inesperado en fallback de consulta:', err)
      }
    }

    // Ejecutar inmediatamente al entrar en estado 'processing'
    checkStatus()

    // Y luego ejecutarlo en bucle cada 2 segundos (más agresivo para detectar VIDEO_SENT antes)
    const interval = setInterval(checkStatus, 2000)

    return () => clearInterval(interval)
  }, [orderId, uploadStatus])

  // ── Se eliminaron los useEffects que revocaban los Object URLs ──
  // En su lugar, el ciclo de vida de los Object URLs se maneja manualmente
  // en las acciones del usuario (handlePhotoSelected y handleCropConfirmed)
  // para evitar problemas con el Strict Mode de React.

  // ── Subida directa a Cloudflare R2 vía URL firmada y fallback de Servidor Proxy ─
  async function uploadBlobToR2(blob: Blob, fileName: string, onProgress?: (p: number) => void): Promise<string> {
    let keyToUse = ''

    try {
      console.log('[upload] Intentando subida directa a R2 vía pre-signed URL para:', fileName)
      // 1. Solicitar URL firmada al backend
      const res = await fetch('/api/upload-video/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          fileName,
          fileType: blob.type,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'No se pudo generar la URL de subida.')
      }

      const { uploadUrl, key } = await res.json()
      keyToUse = key

      // 2. Subir directamente a Cloudflare R2 mediante XHR (para progreso real)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error('Fallo al subir el archivo directamente a Cloudflare R2.'))
          }
        }

        xhr.onerror = () => reject(new Error('Error de red al conectar con Cloudflare R2.'))

        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', blob.type)
        xhr.send(blob)
      })

      console.log('[upload] Subida directa a R2 completada con éxito.')
    } catch (directErr) {
      console.warn('[upload] Falló la subida directa a R2 (posible problema de CORS o red). Iniciando fallback vía Servidor Proxy...', directErr)

      // Fallback: Subir a través del API proxy en el servidor
      const formData = new FormData()
      formData.append('file', blob, fileName)
      formData.append('orderId', orderId)
      formData.append('fileName', fileName)

      const proxyRes = await new Promise<{ success: boolean; key?: string; error?: string }>((resolve) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data)
            } catch {
              resolve({ success: false, error: 'Respuesta inválida del proxy de subida.' })
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve({ success: false, error: data.error || 'Fallo en la subida vía proxy.' })
            } catch {
              resolve({ success: false, error: `Código de error HTTP: ${xhr.status}` })
            }
          }
        }

        xhr.onerror = () => resolve({ success: false, error: 'Error de red al conectar con el servidor proxy.' })

        xhr.open('POST', '/api/upload-video/proxy')
        xhr.send(formData)
      })

      if (!proxyRes.success) {
        throw new Error(proxyRes.error || 'No se pudo subir el archivo a través del proxy del servidor.')
      }

      keyToUse = proxyRes.key!
      console.log('[upload] Subida vía Servidor Proxy completada con éxito.')
    }

    return keyToUse
  }

  // ── Flujo de VIDEO ───────────────────────────────────────────────────────
  async function handleVideoUpload() {
    if (!videoFile) return
    if (!acceptedTerms || !acceptedNoLogos) {
      alert("Por favor, acepta las condiciones generales y confirma que tu video no tiene logotipos antes de continuar.")
      return
    }
    if (!order?.bookings || order.bookings.length === 0) {
      alert("No se encontraron reservas vinculadas a este pedido.")
      return
    }

    setProgress(0)
    isUploadingNewRef.current = true

    // Análisis rápido de aspect ratio (no bloqueante)
    try {
      const meta = await analyzeVideoFile(videoFile)
      const panelRatio = 16 / 9
      if (!isAspectRatioCompatible(meta.aspectRatio, panelRatio)) {
        const ok = window.confirm(
          `El aspect ratio de tu video (${meta.width}×${meta.height}) no coincide exactamente con el panel (16:9).\n\nEl sistema lo ajustará automáticamente con barras negras en tu dispositivo. ¿Continuar?`
        )
        if (!ok) {
          isUploadingNewRef.current = false
          return
        }
      }
    } catch {
      // Si falla el análisis, continuamos igual
    }

    try {
      isImageUploadRef.current = false
      setUploadStatus('processing_client')
      console.log('[video-transcode] Iniciando procesamiento de video en cliente...')

      const processedVideos: { bookingId: string; key: string }[] = []

      // Procesar cada reserva según la resolución de su panel
      for (let i = 0; i < order.bookings.length; i++) {
        const booking = order.bookings[i]
        let width = booking.panels?.resolution_width || 1280
        let height = booking.panels?.resolution_height || 720

        // Garantizar dimensiones pares para libx264
        if (width % 2 !== 0) width = width - 1
        if (height % 2 !== 0) height = height - 1

        console.log(`[video-transcode] Procesando para booking ${booking.id} (${width}x${height})...`)

        const bookingWeight = 100 / order.bookings.length
        const bookingBase = i * bookingWeight

        // 1. Transcodificación client-side (con FFmpeg)
        const processedBlob = await processVideo(videoFile, width, height, (p) => {
          // El progreso total considera el número de bookings
          // Transcodificación representa el 60% de este booking
          const currentStepProgress = (p / 100) * 0.6 * bookingWeight
          setProgress(Math.round(bookingBase + currentStepProgress))
        })

        // 2. Subir a R2
        setUploadStatus('uploading')
        const fileName = `processed-${orderId}-${booking.id}.mp4`
        const key = await uploadBlobToR2(processedBlob, fileName, (u) => {
          // La subida representa el restante 40% de este booking
          const currentStepProgress = 0.6 * bookingWeight + (u / 100) * 0.4 * bookingWeight
          setProgress(Math.round(bookingBase + currentStepProgress))
        })
        processedVideos.push({ bookingId: booking.id, key })

        // Volver a estado de procesamiento para el siguiente booking si queda alguno
        if (i < order.bookings.length - 1) {
          setUploadStatus('processing_client')
        }
      }

      // 3. Notificar al backend de los videos procesados
      console.log('[video-transcode] Notificando videos listos al servidor...')
      const res = await fetch('/api/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          processedVideos,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Error al guardar los videos procesados en el servidor.')
      }

      const resData = await res.json()
      const serverVideoUrl = resData.videoUrl

      // Éxito inmediato: actualizar estado del pedido localmente
      setOrder(prev => {
        if (!prev) return null
        return {
          ...prev,
          status: 'VIDEO_SENT',
          video_url: serverVideoUrl || prev.video_url
        }
      })

      isUploadingNewRef.current = false
      setUploadStatus('success')
      setProgress(100)
    } catch (err) {
      isUploadingNewRef.current = false
      console.error('Video upload error:', err)
      alert(err instanceof Error ? err.message : 'Error al procesar el video.')
      setUploadStatus('idle')
      setProgress(0)
    }
  }

  // ── Flujo de FOTO ────────────────────────────────────────────────────────
  function handlePhotoSelected(file: File) {
    setPhotoFile(file)
    if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl)
    setPhotoObjectUrl(URL.createObjectURL(file))
    setPhotoStep('crop')
    setCroppedArea(null)
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl)
    setCroppedPreviewUrl(null)
  }

  async function handleCropConfirmed(area: Area) {
    setCroppedArea(area)
    // Generar preview del recorte para el FrameSelector
    if (photoObjectUrl) {
      try {
        const previewBlob = await composeImage(photoObjectUrl, area, null, 480, 270)
        if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl)
        setCroppedPreviewUrl(URL.createObjectURL(previewBlob))
      } catch {
        // Si falla el preview no bloqueamos el flujo
      }
    }
    setPhotoStep('frame')
  }

  async function handlePhotoUpload() {
    if (!photoObjectUrl || !croppedArea) return
    if (!acceptedTerms || !acceptedNoLogos) {
      alert("Por favor, acepta las condiciones generales y confirma que tu foto no tiene logotipos antes de continuar.")
      return
    }
    if (!order?.bookings || order.bookings.length === 0) {
      alert("No se encontraron reservas vinculadas a este pedido.")
      return
    }
    setProgress(0)
    isUploadingNewRef.current = true

    try {
      // 1. Composición: crop + marco en canvas (client-side, sin FFmpeg)
      isImageUploadRef.current = true
      setUploadStatus('processing_client')
      setProgress(5)
      console.log('[photo-transcode] Paso 1: composición de imagen...')

      const composedBlob = await composeImage(
        photoObjectUrl,
        croppedArea,
        selectedFrame.src || null,
        1280,
        720
      )
      console.log('[photo-transcode] Paso 1 OK — composedBlob size:', composedBlob.size)
      setProgress(15)

      const processedVideos: { bookingId: string; key: string }[] = []

      // 2. Convertir imagen a video para cada booking según su resolución
      for (let i = 0; i < order.bookings.length; i++) {
        const booking = order.bookings[i]
        let width = booking.panels?.resolution_width || 1280
        let height = booking.panels?.resolution_height || 720
        const duration = booking.panels?.slot_duration_seconds || 7

        if (width % 2 !== 0) width = width - 1
        if (height % 2 !== 0) height = height - 1

        console.log(`[photo-transcode] Convirtiendo imagen a video para booking ${booking.id} (${width}x${height})...`)

        const bookingsSpan = 85
        const bookingWeight = bookingsSpan / order.bookings.length
        const bookingBase = 15 + i * bookingWeight

        const processedBlob = await imageToVideo(composedBlob, duration, width, height, (p) => {
          // Transcodificación representa el 60% del peso de este booking
          const currentStepProgress = (p / 100) * 0.6 * bookingWeight
          setProgress(Math.round(bookingBase + currentStepProgress))
        })

        // Subir a R2
        setUploadStatus('uploading')
        const fileName = `processed-${orderId}-${booking.id}.mp4`
        const key = await uploadBlobToR2(processedBlob, fileName, (u) => {
          // La subida representa el restante 40% del peso de este booking
          const currentStepProgress = 0.6 * bookingWeight + (u / 100) * 0.4 * bookingWeight
          setProgress(Math.round(bookingBase + currentStepProgress))
        })
        processedVideos.push({ bookingId: booking.id, key })

        if (i < order.bookings.length - 1) {
          setUploadStatus('processing_client')
        }
      }

      // 3. Notificar al backend
      console.log('[photo-transcode] Notificando videos listos al servidor...')
      const res = await fetch('/api/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          processedVideos,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Error al guardar los videos procesados en el servidor.')
      }

      const resData = await res.json()
      const serverVideoUrl = resData.videoUrl

      // Éxito inmediato: actualizar estado del pedido localmente
      setOrder(prev => {
        if (!prev) return null
        return {
          ...prev,
          status: 'VIDEO_SENT',
          video_url: serverVideoUrl || prev.video_url
        }
      })

      // Éxito inmediato
      isUploadingNewRef.current = false
      setUploadStatus('success')
      setProgress(100)
    } catch (err) {
      isUploadingNewRef.current = false
      console.error('Photo upload error:', err)
      alert(err instanceof Error ? err.message : 'Error al procesar la imagen.')
      setUploadStatus('idle')
      setProgress(0)
    }
  }



  // ── Render: Loading inicial ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 pt-12 md:pt-16 overflow-x-hidden">
      <TopBar right={<AuthButton />} />

      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col p-3 md:p-6 relative z-10">

        {/* Botón volver */}
        <BackButton href="/dashboard/orders" label="Volver" variant="small" className="mb-2 md:mb-4 px-3 py-1.5 md:px-4 md:py-2" />

        <AnimatePresence mode="wait">

          {/* ── ÉXITO ─────────────────────────────────────────────────────── */}
          {uploadStatus === 'success' && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <UploadSuccess
                videoUrl={order?.video_url ?? undefined}
                orderId={orderId}
                status={order?.status}
              />
            </motion.div>
          )}

          {/* ── PROCESANDO / SUBIENDO ─────────────────────────────────────── */}
          {(uploadStatus === 'processing' || uploadStatus === 'uploading' || uploadStatus === 'processing_client') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center justify-center min-h-[500px]"
            >
              <UploadLoading progress={progress} stage={uploadStatus === 'uploading' ? 'uploading' : uploadStatus === 'processing_client' ? 'processing_client' : 'processing'} />
            </motion.div>
          )}

          {/* ── PROCESAMIENTO EN SEGUNDO PLANO (timeout serverless) ───────── */}
          {uploadStatus === 'processing_background' && (
            <motion.div
              key="background"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center justify-center min-h-[500px]"
            >
              <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-lg p-10 md:p-16 max-w-lg w-full shadow-2xl flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
                  />
                </div>
                <h2 className="text-2xl font-bold mb-3">Procesando en segundo plano</h2>
                <p className="text-muted-foreground text-sm mb-2 font-medium">
                  El servidor está convirtiendo tu material. Esto puede tomar unos minutos adicionales.
                </p>
                <p className="text-xs text-muted-foreground/70 italic mb-8">
                  ✅ Ya puedes cerrar esta pestaña con seguridad. Cuando esté listo verás tu video en la sección de pedidos.
                </p>
                <button
                  onClick={() => router.push('/dashboard/orders')}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  Ver mis pedidos
                </button>
              </div>
            </motion.div>
          )}

          {/* ── FLUJO IDLE ────────────────────────────────────────────────── */}
          {uploadStatus === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col w-full max-w-3xl mx-auto"
            >
              {/* ── LEFT: Estudio de Creación ───────────────────────── */}
              <section className="w-full flex flex-col bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl md:rounded-[2rem] p-3 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />

                {/* Header */}
                <div className="relative z-10 space-y-1 mb-3 md:mb-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] border border-primary/20"
                  >
                    <Rocket size={8} className="md:w-2.5 md:h-2.5" />
                    Pedido #{orderId?.slice(0, 8).toUpperCase()}
                  </motion.div>

                  {contentType === 'idle' ? (
                    <>
                      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight max-w-xl">
                        {userType === 'entrepreneur'
                          ? 'Sube el anuncio de tu negocio'
                          : userType === 'influencer'
                            ? 'Comparte tu contenido con el mundo'
                            : '¿Qué tipo de material subirás?'}
                      </h1>
                      <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground max-w-2xl font-medium leading-relaxed opacity-80 mt-1">
                        {userType === 'entrepreneur'
                          ? 'Elige si deseas subir una imagen publicitaria de tu marca o tu video promocional'
                          : userType === 'influencer'
                            ? 'Elige si deseas subir un banner de tus redes o tu video promocional'
                            : 'Elige tu formato de video o foto'}
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Botón volver al selector de tipo */}
                      {(contentType === 'photo' || contentType === 'video') && (
                        <button
                          onClick={() => {
                            setContentType('idle')
                            setPhotoStep('drop')
                            setPhotoFile(null)
                            setVideoFile(null)
                            setAcceptedTerms(false)
                            setAcceptedNoLogos(false)
                            if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl)
                            setPhotoObjectUrl(null)
                          }}
                          className="p-1.5 sm:p-2 rounded-xl bg-muted/50 hover:bg-muted border border-border transition-all"
                        >
                          <ChevronLeft size={16} />
                        </button>
                      )}
                      <div>
                        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight leading-none">
                          {contentType === 'photo'
                            ? userType === 'entrepreneur' ? 'Tu anuncio'
                              : userType === 'influencer' ? 'Tu banner'
                                : 'Tu foto'
                            : userType === 'entrepreneur' ? 'Tu spot promocional'
                              : 'Tu video'}
                        </h1>
                        <p className="hidden sm:block text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                          {contentType === 'photo'
                            ? 'Ajusta la imagen al formato de nuestras pantallas'
                            : `Optimizaremos la duración a ${panelDetails?.slotDurationSeconds || 7} segundos`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── SELECTOR TIPO (solo si order.status === PENDING_UPLOAD) ── */}
                {order?.status === 'PENDING_UPLOAD' && contentType === 'idle' && (
                  <div className="relative z-10">
                    <UploadTypeSelector onSelect={setContentType} userType={userType} />
                  </div>
                )}

                {/* ── FLUJO FOTO ─────────────────────────────────────────── */}
                {contentType === 'photo' && (
                  <div className="relative z-10 space-y-4 md:space-y-5">
                    {photoStep === 'drop' && (
                      <>
                        {/* Specs del panel */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                          {dynamicPhotoSpecs.map((s, i) => (
                            <Spec key={i} {...s} />
                          ))}
                        </div>
                        {panelDetails?.operatingStartTime && (
                          <div className="text-[10px] md:text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-3 py-2 flex items-center gap-2 font-medium">
                            <Clock size={12} className="text-primary shrink-0" />
                            <span>
                              Transmisión activa: <strong>{panelDetails.operatingStartTime.substring(0, 5)}</strong> a <strong>{panelDetails.operatingEndTime === '00:00:00' ? '12:00 AM' : panelDetails.operatingEndTime.substring(0, 5)}</strong>. El anuncio se reproducirá en un bucle dinámico de <strong>{panelDetails.maxSlots || 23} campañas</strong>.
                            </span>
                          </div>
                        )}

                        <PhotoDropzone onFile={handlePhotoSelected} />

                        {/* Nota Importante */}
                        <ImportantNote userType={userType} />

                        <ConsentCheckboxes
                          acceptedTerms={acceptedTerms}
                          setAcceptedTerms={setAcceptedTerms}
                          acceptedNoLogos={acceptedNoLogos}
                          setAcceptedNoLogos={setAcceptedNoLogos}
                          userType={userType}
                        />

                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                          <Button
                            disabled={!photoFile || !acceptedTerms || !acceptedNoLogos}
                            onClick={handlePhotoUpload}
                            className="w-full sm:w-auto px-6 py-3 text-xs font-black uppercase tracking-widest h-auto rounded-[calc(var(--radius)*0.875)] shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4)]"
                          >
                            <Send size={14} className="mr-2" />
                            <span>
                              {!photoFile
                                ? '☝️ Primero selecciona tu foto'
                                : (!acceptedTerms || !acceptedNoLogos)
                                  ? '👉 Marca las casillas de abajo'
                                  : '🚀 ¡Listo! Enviar mi anuncio'}
                            </span>
                          </Button>
                        </div>
                      </>
                    )}

                    {photoStep === 'crop' && photoObjectUrl && (
                      <PhotoCropEditor
                        imageSrc={photoObjectUrl}
                        aspectRatio={cropAspectRatio}
                        onCropComplete={handleCropConfirmed}
                      />
                    )}

                    {photoStep === 'frame' && (
                      <>
                        <FrameSelector
                          previewSrc={croppedPreviewUrl ?? photoObjectUrl ?? ''}
                          selectedFrameId={selectedFrame.id}
                          onSelectFrame={setSelectedFrame}
                        />

                        <ConsentCheckboxes
                          acceptedTerms={acceptedTerms}
                          setAcceptedTerms={setAcceptedTerms}
                          acceptedNoLogos={acceptedNoLogos}
                          setAcceptedNoLogos={setAcceptedNoLogos}
                          userType={userType}
                        />

                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                          <Button
                            disabled={!acceptedTerms || !acceptedNoLogos}
                            onClick={handlePhotoUpload}
                            className="w-full sm:w-auto px-6 py-3 text-xs font-black uppercase tracking-widest h-auto rounded-[calc(var(--radius)*0.875)] shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4)]"
                          >
                            <Send size={14} className="mr-2" />
                            <span>
                              {(!acceptedTerms || !acceptedNoLogos)
                                ? '👉 Marca las casillas de abajo'
                                : '🚀 ¡Listo! Enviar mi anuncio'}
                            </span>
                          </Button>
                          <Button
                            variant="link"
                            onClick={() => setPhotoStep('crop')}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground py-2 px-1 h-auto"
                          >
                            ← Volver al recorte
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── FLUJO VIDEO ─────────────────────────────────────────── */}
                {contentType === 'video' && (
                  <div className="relative z-10 space-y-4 md:space-y-5">
                    {/* Specs del panel */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                      {dynamicVideoSpecs.map((s, i) => (
                        <Spec key={i} {...s} />
                      ))}
                    </div>
                    {panelDetails?.operatingStartTime && (
                      <div className="text-[10px] md:text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-3 py-2 flex items-center gap-2 font-medium">
                        <Clock size={12} className="text-primary shrink-0" />
                        <span>
                          Transmisión activa: <strong>{panelDetails.operatingStartTime.substring(0, 5)}</strong> a <strong>{panelDetails.operatingEndTime === '00:00:00' ? '12:00 AM' : panelDetails.operatingEndTime.substring(0, 5)}</strong>. El video se reproducirá en un bucle dinámico de <strong>{panelDetails.maxSlots || 23} campañas</strong>.
                        </span>
                      </div>
                    )}

                    <UploadDropzone
                      file={videoFile}
                      setFile={setVideoFile}
                    />

                    {/* Nota Importante */}
                    <ImportantNote userType={userType} />

                    <ConsentCheckboxes
                      acceptedTerms={acceptedTerms}
                      setAcceptedTerms={setAcceptedTerms}
                      acceptedNoLogos={acceptedNoLogos}
                      setAcceptedNoLogos={setAcceptedNoLogos}
                      userType={userType}
                    />

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                      <Button
                        disabled={!videoFile || !acceptedTerms || !acceptedNoLogos}
                        onClick={handleVideoUpload}
                        className="w-full sm:w-auto px-6 py-3 text-xs font-black uppercase tracking-widest h-auto rounded-[calc(var(--radius)*0.875)] shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4)]"
                      >
                        <Send size={14} className="mr-2" />
                        <span>
                          {!videoFile
                            ? '☝️ Primero selecciona tu video'
                            : (!acceptedTerms || !acceptedNoLogos)
                              ? '👉 Marca las casillas de abajo'
                              : '🚀 ¡Listo! Enviar mi anuncio'}
                        </span>
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}

function Loader() {
  return (
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
      </div>
    </div>
  )
}
