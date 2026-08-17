'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Send, Rocket, ShieldCheck, Clock, Layers, Sparkles, X, MapPin, Info, Check, AlertTriangle, FileText, Download, Pencil, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Area } from 'react-easy-crop'
import Link from 'next/link'

import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'
import { createClient } from '@/lib/supabase/client'

// Upload sub-components
import { UploadSuccess } from '@/components/upload/UploadSuccess'
import { UploadLoading } from '@/components/upload/UploadLoading'
import { PhotoCropEditor } from '@/components/upload/PhotoCropEditor'
import { FrameSelector, AVAILABLE_FRAMES, Frame } from '@/components/upload/FrameSelector'
import { ScreenMediaCard, ScreenBookingInfo, MediaState } from '@/components/upload/ScreenMediaCard'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'

// Libs
import { composeImage } from '@/lib/imageComposer'
import { processVideo, imageToVideo } from '@/lib/ffmpegClient'

// ─── Tipos locales ──────────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'processing' | 'uploading' | 'success' | 'processing_background'

interface Order {
  id: string
  status: string
  video_url: string | null
  total_amount?: number | null
  created_at?: string
  rejection_reason?: string | null
  bookings?: any[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Spec({ label, val, icon: Icon }: { label: string; val: string; icon: typeof ShieldCheck }) {
  return (
    <div className="bg-card/60 border border-border/50 px-2.5 py-1.5 rounded-xl flex items-center gap-2 flex-1 min-w-[45%] shadow-sm">
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <Icon size={13} />
      </div>
      <div className="flex flex-col">
        <span className="text-[7px] md:text-[8px] uppercase tracking-wider font-bold text-muted-foreground/70 leading-none">{label}</span>
        <span className="text-[10px] md:text-xs font-black text-foreground leading-none mt-0.5">{val}</span>
      </div>
    </div>
  )
}

interface ScrollToAcceptModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  title: string
  children: React.ReactNode
}

function ScrollToAcceptModal({
  isOpen,
  onClose,
  onAccept,
  title,
  children,
}: ScrollToAcceptModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false)
      setTimeout(() => {
        if (contentRef.current) {
          const { clientHeight, scrollHeight } = contentRef.current
          if (scrollHeight <= clientHeight + 10) {
            setHasScrolledToBottom(true)
          }
        }
      }, 100)
    }
  }, [isOpen])

  const handleScroll = () => {
    if (!contentRef.current) return
    const { scrollTop, clientHeight, scrollHeight } = contentRef.current
    if (scrollTop + clientHeight >= scrollHeight - 15) {
      setHasScrolledToBottom(true)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
          />

          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="pointer-events-auto w-full max-w-lg bg-card border border-border rounded-dialog flex flex-col max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="text-primary w-5 h-5 shrink-0" />
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div
                ref={contentRef}
                onScroll={handleScroll}
                className="p-5 overflow-y-auto flex-1 custom-scrollbar text-sm text-muted-foreground space-y-4 leading-relaxed max-h-[50vh]"
              >
                {children}
              </div>

              <div className="p-4 border-t border-border bg-muted/10 flex flex-col gap-2">
                {!hasScrolledToBottom && (
                  <p className="text-[11px] text-center text-amber-500 font-semibold animate-pulse">
                    ⚠️ Por favor, desplázate hasta el final para poder aceptar los términos.
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 font-bold text-xs uppercase tracking-wider border-2"
                  >
                    Cerrar
                  </Button>
                  <Button
                    disabled={!hasScrolledToBottom}
                    onClick={() => {
                      onAccept()
                      onClose()
                    }}
                    className="flex-1 font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Acepto y he leído
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

interface ConsentCheckboxesProps {
  acceptedTerms: boolean
  setAcceptedTerms: (val: boolean) => void
  acceptedNoLogos: boolean
  setAcceptedNoLogos: (val: boolean) => void
  userType: string
  onOpenTermsModal: () => void
  onOpenLogosModal: () => void
}

function ConsentCheckboxes({
  acceptedTerms,
  setAcceptedTerms,
  acceptedNoLogos,
  setAcceptedNoLogos,
  userType,
  onOpenTermsModal,
  onOpenLogosModal,
}: ConsentCheckboxesProps) {
  const getLogosLabel = () => {
    switch (userType) {
      case 'entrepreneur':
        return (
          <>
            Confirmo que el logo y las imágenes que estoy subiendo <span className="text-foreground font-bold">pertenecen a mi negocio</span>.*
          </>
        )
      case 'influencer':
        return (
          <>
            Confirmo que este material <span className="text-foreground font-bold">promueve mi propia marca personal o redes</span> y no publicidad de otras empresas.*
          </>
        )
      case 'individual':
      default:
        return (
          <>
            Confirmo que mi foto o video es de uso personal y <span className="text-foreground font-bold">no contiene logotipos ni marcas de otras empresas</span>.*
          </>
        )
    }
  }

  return (
    <div className="py-2 my-2 space-y-3 relative group/consent">
      <div className="grid grid-cols-[24px_1fr] items-start gap-3 relative z-10">
        <div
          onClick={(e) => {
            e.preventDefault()
            if (!acceptedTerms) {
              onOpenTermsModal()
            } else {
              setAcceptedTerms(false)
            }
          }}
          className="mt-0.5 cursor-pointer"
        >
          <Checkbox
            id="terms-check"
            checked={acceptedTerms}
            onChange={() => { }}
            className="pointer-events-none"
          />
        </div>
        <div
          onClick={() => {
            if (!acceptedTerms) {
              onOpenTermsModal()
            } else {
              setAcceptedTerms(false)
            }
          }}
          className="text-xs text-muted-foreground leading-snug cursor-pointer select-none font-medium"
        >
          Acepto las <span className="text-primary font-bold hover:underline">normas de uso y condiciones</span> de las pantallas de JMT.*
        </div>
      </div>

      <div className="grid grid-cols-[24px_1fr] items-start gap-3 relative z-10">
        <div
          onClick={(e) => {
            e.preventDefault()
            if (!acceptedNoLogos) {
              onOpenLogosModal()
            } else {
              setAcceptedNoLogos(false)
            }
          }}
          className="mt-0.5 cursor-pointer"
        >
          <Checkbox
            id="logos-check"
            checked={acceptedNoLogos}
            onChange={() => { }}
            className="pointer-events-none"
          />
        </div>
        <div
          onClick={() => {
            if (!acceptedNoLogos) {
              onOpenLogosModal()
            } else {
              setAcceptedNoLogos(false)
            }
          }}
          className="text-xs text-muted-foreground leading-snug cursor-pointer select-none font-medium"
        >
          {getLogosLabel()}
        </div>
      </div>
    </div>
  )
}

function ImportantNote({ userType }: { userType: string }) {
  const getNoteContent = () => {
    switch (userType) {
      case 'entrepreneur':
        return {
          title: 'REGLAS IMPORTANTES PARA TU NEGOCIO',
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
          title: 'REGLAS IMPORTANTES PARA CREADORES',
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
          title: 'REGLAS IMPORTANTES PARA TU ANUNCIO',
          allowed: [
            'Fotos tuyas, familiares o con amigos para saludos',
            'Tu nombre, dedicatorias o mensajes de celebración',
            'Tu usuario personal de redes sociales'
          ],
          forbidden: [
            'Logos comerciales o publicidad de marcas ajenas',
            'Cigarros, alcohol, violencia o groserías'
          ]
        }
    }
  }

  const note = getNoteContent()

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} className="text-amber-500 shrink-0" />
        <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
          {note.title}
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-2.5 pt-1">
        {/* Permitidos */}
        <div className="bg-emerald-500/[0.04] border border-emerald-500/20 p-3 rounded-xl space-y-1.5">
          <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Check size={13} className="stroke-[3]" /> Lo que SÍ puedes subir:
          </p>
          <ul className="space-y-1">
            {note.allowed.map((item, idx) => (
              <li key={idx} className="text-xs text-muted-foreground font-medium leading-tight flex items-start gap-1.5">
                <span className="text-emerald-500 select-none">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prohibidos */}
        <div className="bg-rose-500/[0.04] border border-rose-500/20 p-3 rounded-xl space-y-1.5">
          <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <X size={13} className="stroke-[3]" /> Lo que NO está permitido:
          </p>
          <ul className="space-y-1">
            {note.forbidden.map((item, idx) => (
              <li key={idx} className="text-xs text-muted-foreground font-medium leading-tight flex items-start gap-1.5">
                <span className="text-rose-500 select-none">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[10.5px] text-muted-foreground/75 font-medium leading-relaxed pt-1">
        * Si tu anuncio contiene elementos no permitidos, será observado por nuestro equipo y te pediremos cambiarlo.
      </p>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function OrderSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = params.orderId as string

  // Order data
  const [order, setOrder] = useState<Order | null>(null)
  const [screens, setScreens] = useState<ScreenBookingInfo[]>([])
  const [applyToAllScreens, setApplyToAllScreens] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  // Media state map per booking ID
  const [mediaMap, setMediaMap] = useState<Record<string, MediaState>>({})

  // UI flow state
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [isEditing, setIsEditing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [userType, setUserType] = useState<string>('individual')
  const isUploadingNewRef = useRef(false)

  // Image cropping/framing state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [frameModalOpen, setFrameModalOpen] = useState(false)
  const [activeCropScreen, setActiveCropScreen] = useState<ScreenBookingInfo | null>(null)
  const [currentPhotoFile, setCurrentPhotoFile] = useState<File | null>(null)
  const [currentPhotoObjectUrl, setCurrentPhotoObjectUrl] = useState<string | null>(null)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<Frame>(AVAILABLE_FRAMES[0])
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)

  // Consent checkboxes
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedNoLogos, setAcceptedNoLogos] = useState(false)

  // Modales de términos
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [logosModalOpen, setLogosModalOpen] = useState(false)

  const firstScreen = screens[0]

  // Start editing mode: preloads existing videos
  const handleStartEdit = (targetBookingId?: string) => {
    setIsEditing(true)
    setAcceptedTerms(true)
    setAcceptedNoLogos(true)

    setMediaMap((prev) => {
      const updated: Record<string, MediaState> = { ...prev }
      screens.forEach((scr) => {
        const dbBooking = order?.bookings?.find((b: any) => b.id === scr.bookingId)
        const currentUrl = prev[scr.bookingId]?.previewUrl || dbBooking?.video_url || scr.videoUrl || order?.video_url
        if (currentUrl) {
          updated[scr.bookingId] = {
            file: null,
            fileType: 'video',
            processedBlob: null,
            previewUrl: currentUrl,
            status: 'ready',
            progress: 100,
            isExisting: true,
            originalUrl: currentUrl,
          }
        }
      })
      return updated
    })

    setUploadStatus('idle')
  }

  // Cancel edit mode: revert to success if previously uploaded
  const handleCancelEdit = () => {
    setIsEditing(false)
    if (
      order?.status === 'VIDEO_SENT' ||
      order?.status === 'PENDING_VALIDATION' ||
      (order?.video_url && order.status !== 'PENDING_UPLOAD')
    ) {
      setUploadStatus('success')
    }
  }

  // Restore a screen to its original uploaded video
  const handleRestoreOriginal = (bookingId: string) => {
    setMediaMap((prev) => {
      const item = prev[bookingId]
      if (!item || !item.originalUrl) return prev
      if (item.previewUrl && !item.isExisting) {
        URL.revokeObjectURL(item.previewUrl)
      }
      return {
        ...prev,
        [bookingId]: {
          file: null,
          fileType: 'video',
          processedBlob: null,
          previewUrl: item.originalUrl,
          status: 'ready',
          progress: 100,
          isExisting: true,
          originalUrl: item.originalUrl,
        },
      }
    })
  }

  // Fetch order on mount
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const supabase = createClient()

        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, status, video_url, user_id, total_amount, created_at, rejection_reason,
            profiles(user_type),
            bookings(
              id,
              panel_id,
              video_url,
              start_date,
              end_date,
              amount,
              panels(
                id,
                panel_code,
                resolution_width,
                resolution_height,
                slot_duration_seconds,
                max_slots,
                operating_start_time,
                operating_end_time,
                structures(
                  address,
                  district,
                  city
                )
              )
            )
          `)
          .eq('id', orderId)
          .single()

        if (error) {
          console.error('[fetchOrder] Error querying order with relations:', error)
        }

        if (data) {
          const profile = data.profiles as any
          if (profile?.user_type) setUserType(profile.user_type)
          setOrder(data as Order)

          // Extraer pantallas de los bookings
          const bookingList = (data.bookings as any[]) || []
          const extractedScreens: ScreenBookingInfo[] = bookingList.map((b) => {
            const p = b.panels || {}
            const s = p.structures || (Array.isArray(p.structures) ? p.structures[0] : {}) || {}
            const districtName = s.district || p.district || ''
            return {
              bookingId: b.id,
              panelId: p.id || b.panel_id,
              panelCode: p.panel_code || 'PANEL',
              panelName: districtName ? `${p.panel_code || ''} — ${districtName}` : p.panel_code || 'Pantalla Digital',
              district: districtName,
              city: s.city || p.city || '',
              address: s.address || p.address || '',
              resolutionWidth: p.resolution_width || p.width || 1280,
              resolutionHeight: p.resolution_height || p.height || 720,
              slotDurationSeconds: p.slot_duration_seconds || 7,
              operatingStartTime: p.operating_start_time || '06:00:00',
              operatingEndTime: p.operating_end_time || '00:00:00',
              videoUrl: b.video_url || null,
            }
          })

          setScreens(extractedScreens)

          const shouldEdit = searchParams.get('edit') === 'true'

          // Inicializar mediaMap para cada booking
          const initialMap: Record<string, MediaState> = {}
          extractedScreens.forEach((scr) => {
            const hasExisting = !!(scr.videoUrl || data.video_url)
            initialMap[scr.bookingId] = {
              file: null,
              fileType: hasExisting ? 'video' : null,
              processedBlob: null,
              previewUrl: scr.videoUrl || data.video_url || null,
              status: hasExisting ? 'ready' : 'idle',
              progress: hasExisting ? 100 : 0,
              isExisting: hasExisting,
              originalUrl: scr.videoUrl || data.video_url || null,
            }
          })
          setMediaMap(initialMap)

          if (shouldEdit) {
            setIsEditing(true)
            setAcceptedTerms(true)
            setAcceptedNoLogos(true)
            setUploadStatus('idle')
          } else if (
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
  }, [orderId, searchParams])

  // Prevenir navegación accidental durante la subida activa
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadStatus === 'uploading') {
        e.preventDefault()
        e.returnValue = 'La subida de tu anuncio está en progreso. Si sales ahora se cancelará. ¿Seguro que deseas salir?'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [uploadStatus])

  // Realtime subscription for status updates
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
          const updatedOrder = payload.new as Order
          setOrder(prev => prev ? { ...prev, ...updatedOrder } : updatedOrder)

          if (isUploadingNewRef.current || isEditing) return

          if (updatedOrder.status === 'VIDEO_SENT' && updatedOrder.video_url) {
            setUploadStatus('success')
            setProgress(100)
          } else if (updatedOrder.status === 'PENDING_UPLOAD') {
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
  }, [orderId, isEditing])

  // Helper upload function
  async function uploadBlobToR2(blob: Blob, fileName: string, onProgress?: (p: number) => void): Promise<string> {
    let keyToUse = ''

    try {
      const res = await fetch('/api/upload-video/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, fileName, fileType: blob.type }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'No se pudo generar la URL de subida.')
      }

      const { uploadUrl, key } = await res.json()
      keyToUse = key

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error('Fallo al subir el archivo directamente a Cloudflare R2.'))
        }
        xhr.onerror = () => reject(new Error('Error de red al conectar con Cloudflare R2.'))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', blob.type)
        xhr.send(blob)
      })
    } catch (directErr) {
      console.warn('[upload] Fallback a proxy...', directErr)
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
              resolve(JSON.parse(xhr.responseText))
            } catch {
              resolve({ success: false, error: 'Respuesta inválida del proxy.' })
            }
          } else {
            resolve({ success: false, error: 'Fallo en la subida vía proxy.' })
          }
        }
        xhr.onerror = () => resolve({ success: false, error: 'Error de red en proxy.' })
        xhr.open('POST', '/api/upload-video/proxy')
        xhr.send(formData)
      })

      if (!proxyRes.success) {
        throw new Error(proxyRes.error || 'Error al subir vía proxy.')
      }

      keyToUse = proxyRes.key!
    }

    return keyToUse
  }

  // Handle file selection from ScreenMediaCard
  async function handleFileSelectedForScreen(file: File, type: 'video' | 'image', targetScreen: ScreenBookingInfo) {
    if (!screens || screens.length === 0) return

    const targetScreens = applyToAllScreens ? screens : [targetScreen]

    if (type === 'video') {
      for (const scr of targetScreens) {
        const existingOriginal = mediaMap[scr.bookingId]?.originalUrl || scr.videoUrl || order?.video_url

        setMediaMap((prev) => ({
          ...prev,
          [scr.bookingId]: {
            ...prev[scr.bookingId],
            file,
            fileType: 'video',
            status: 'processing',
            progress: 10,
            isExisting: false,
            originalUrl: existingOriginal,
          },
        }))

        try {
          let width = scr.resolutionWidth || 1280
          let height = scr.resolutionHeight || 720
          const duration = scr.slotDurationSeconds || 7
          if (width % 2 !== 0) width -= 1
          if (height % 2 !== 0) height -= 1

          const processedBlob = await processVideo(file, width, height, duration, (p) => {
            setMediaMap((prev) => ({
              ...prev,
              [scr.bookingId]: {
                ...prev[scr.bookingId],
                progress: p,
              },
            }))
          })

          const previewUrl = URL.createObjectURL(processedBlob)

          setMediaMap((prev) => ({
            ...prev,
            [scr.bookingId]: {
              file,
              fileType: 'video',
              processedBlob,
              previewUrl,
              status: 'ready',
              progress: 100,
              isExisting: false,
              originalUrl: existingOriginal,
            },
          }))
        } catch (err) {
          console.error('Error processing video for screen', scr.bookingId, err)
          setMediaMap((prev) => ({
            ...prev,
            [scr.bookingId]: {
              ...prev[scr.bookingId],
              status: 'error',
              error: err instanceof Error ? err.message : 'Error al procesar video',
            },
          }))
        }
      }
    } else {
      // Image flow
      setActiveCropScreen(targetScreen)
      setCurrentPhotoFile(file)
      if (currentPhotoObjectUrl) URL.revokeObjectURL(currentPhotoObjectUrl)
      setCurrentPhotoObjectUrl(URL.createObjectURL(file))
      setCropModalOpen(true)
    }
  }

  // Handle Image Crop confirmation
  async function handleCropConfirmed(area: Area) {
    setCroppedArea(area)
    if (currentPhotoObjectUrl) {
      try {
        const previewBlob = await composeImage(currentPhotoObjectUrl, area, null, 480, 270)
        if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl)
        setCroppedPreviewUrl(URL.createObjectURL(previewBlob))
      } catch (err) {
        console.error('Error generating preview:', err)
      }
    }
    setCropModalOpen(false)
    setFrameModalOpen(true)
  }

  // Handle Image Frame selection and complete image processing
  async function handleFrameConfirmed() {
    setFrameModalOpen(false)
    if (!currentPhotoObjectUrl || !croppedArea) return

    const targetScreens = applyToAllScreens ? screens : (activeCropScreen ? [activeCropScreen] : screens.slice(0, 1))

    for (const scr of targetScreens) {
      const existingOriginal = mediaMap[scr.bookingId]?.originalUrl || scr.videoUrl || order?.video_url

      setMediaMap((prev) => ({
        ...prev,
        [scr.bookingId]: {
          ...prev[scr.bookingId],
          file: currentPhotoFile,
          fileType: 'image',
          status: 'processing',
          progress: 15,
          isExisting: false,
          originalUrl: existingOriginal,
        },
      }))

      try {
        let width = scr.resolutionWidth || 1280
        let height = scr.resolutionHeight || 720
        const duration = scr.slotDurationSeconds || 7
        if (width % 2 !== 0) width -= 1
        if (height % 2 !== 0) height -= 1

        const composedBlob = await composeImage(
          currentPhotoObjectUrl,
          croppedArea,
          selectedFrame.src || null,
          width,
          height
        )

        const processedBlob = await imageToVideo(composedBlob, duration, width, height, (p) => {
          setMediaMap((prev) => ({
            ...prev,
            [scr.bookingId]: {
              ...prev[scr.bookingId],
              progress: 15 + Math.round((p / 100) * 85),
            },
          }))
        })

        const previewUrl = URL.createObjectURL(processedBlob)

        setMediaMap((prev) => ({
          ...prev,
          [scr.bookingId]: {
            file: currentPhotoFile,
            fileType: 'image',
            processedBlob,
            previewUrl,
            status: 'ready',
            progress: 100,
            isExisting: false,
            originalUrl: existingOriginal,
          },
        }))
      } catch (err) {
        console.error('Error processing image for screen', scr.bookingId, err)
        setMediaMap((prev) => ({
          ...prev,
          [scr.bookingId]: {
            ...prev[scr.bookingId],
            status: 'error',
            error: err instanceof Error ? err.message : 'Error al procesar imagen',
          },
        }))
      }
    }
  }

  // Remove media for a screen
  function handleRemoveMedia(bookingId: string) {
    setMediaMap((prev) => {
      const copy = { ...prev }
      if (copy[bookingId]?.previewUrl && !copy[bookingId]?.isExisting) {
        URL.revokeObjectURL(copy[bookingId].previewUrl!)
      }
      copy[bookingId] = {
        file: null,
        fileType: null,
        processedBlob: null,
        previewUrl: null,
        status: 'idle',
        isExisting: false,
        originalUrl: copy[bookingId]?.originalUrl || null,
      }
      return copy
    })
  }

  // Check if ALL screens have ready media (either new processedBlob or existing url)
  const allScreensReady = screens.length > 0 && screens.every((scr) => {
    const m = mediaMap[scr.bookingId]
    return m && m.status === 'ready' && (m.processedBlob || m.isExisting || m.previewUrl)
  })

  // Final submit handler
  async function handleSubmitOrderMedia() {
    if (!allScreensReady) {
      alert("Por favor, sube y procesa el material para todas las pantallas del pedido antes de continuar.")
      return
    }
    if (!acceptedTerms || !acceptedNoLogos) {
      alert("Por favor, acepta las condiciones generales y confirma la autoría de tu contenido antes de enviar.")
      return
    }

    setProgress(0)
    isUploadingNewRef.current = true
    setUploadStatus('uploading')

    try {
      const processedVideos: { bookingId: string; key?: string; existingUrl?: string }[] = []
      const totalCount = screens.length

      // Identify which items actually need upload
      const itemsToUpload = screens.filter((scr) => {
        const m = mediaMap[scr.bookingId]
        return m?.processedBlob && !m.isExisting
      })

      let uploadedCount = 0

      for (let i = 0; i < totalCount; i++) {
        const scr = screens[i]
        const media = mediaMap[scr.bookingId]
        if (!media) continue

        if (media.processedBlob && !media.isExisting) {
          const fileName = `processed-${orderId}-${scr.bookingId}.mp4`
          const baseProgress = itemsToUpload.length > 0 ? (uploadedCount / itemsToUpload.length) * 100 : 0

          const key = await uploadBlobToR2(media.processedBlob, fileName, (u) => {
            const stepProgress = Math.round(baseProgress + (u / (itemsToUpload.length || 1)))
            setProgress(stepProgress)
          })

          uploadedCount++
          processedVideos.push({ bookingId: scr.bookingId, key })
        } else {
          // Keep existing URL
          const dbBooking = order?.bookings?.find((b: any) => b.id === scr.bookingId)
          const currentUrl = media.previewUrl || dbBooking?.video_url || scr.videoUrl || order?.video_url
          processedVideos.push({ bookingId: scr.bookingId, existingUrl: currentUrl || undefined })
        }
      }

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
        throw new Error(errData.error || 'Error al guardar los videos en el servidor.')
      }

      const resData = await res.json()

      setOrder((prev) => prev ? { ...prev, status: 'VIDEO_SENT', video_url: resData.videoUrl || prev.video_url } : null)
      setIsEditing(false)
      isUploadingNewRef.current = false
      setUploadStatus('success')
      setProgress(100)
    } catch (err) {
      isUploadingNewRef.current = false
      console.error('Error submitting order media:', err)
      alert(err instanceof Error ? err.message : 'Error al enviar propuesta.')
      setUploadStatus('idle')
      setProgress(0)
    }
  }

  const getLogosModalContent = () => {
    switch (userType) {
      case 'entrepreneur':
        return (
          <div className="space-y-4 text-justify text-xs md:text-sm">
            <p className="font-semibold text-foreground">
              Al subir material publicitario comercial para tu negocio, confirmas la legalidad del material gráfico y aceptas las siguientes condiciones de propiedad intelectual:
            </p>
            <div className="space-y-2">
              <h4 className="font-bold text-foreground text-emerald-600 dark:text-emerald-500">1. Autoría y Uso de Marca Propia</h4>
              <p>
                Garantizas que eres el titular legítimo del nombre comercial, el logotipo y todos los recursos gráficos y fotográficos adjuntos en tu anuncio, o bien cuentas con las licencias correspondientes para su difusión pública comercial.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-foreground text-rose-600 dark:text-rose-400">2. Prohibición de Uso de Marcas de Terceros</h4>
              <p>
                Está estrictamente prohibido incluir logotipos, slogans o imagotipos de marcas reconocidas nacionales o internacionales (por ejemplo: Coca-Cola, Nike, Apple, etc.) a menos que seas un distribuidor oficial autorizado.
              </p>
            </div>
          </div>
        )
      case 'influencer':
        return (
          <div className="space-y-4 text-justify text-xs md:text-sm">
            <p className="font-semibold text-foreground">
              Como creador de contenido, confirmas la titularidad de tu canal/redes y aceptas las reglas para la promoción en vía pública.
            </p>
          </div>
        )
      case 'individual':
      default:
        return (
          <div className="space-y-4 text-justify text-xs md:text-sm">
            <p className="font-semibold text-foreground">
              Al subir tu saludo o material de uso personal, declaras el cumplimiento de nuestras condiciones.
            </p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  const dynamicVideoSpecs = [
    { label: 'Resolución', val: firstScreen ? `${firstScreen.resolutionWidth}×${firstScreen.resolutionHeight}` : '1280×720', icon: ShieldCheck },
    { label: 'Duración', val: firstScreen ? `${firstScreen.slotDurationSeconds} Seg` : '7 Seg', icon: Clock },
    { label: 'Formato', val: 'MP4 / JPG', icon: CheckCircle2 },
    { label: 'Peso Máx', val: '100MB', icon: ShieldCheck },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 pt-12 md:pt-16 overflow-x-clip">
      <TopBar right={<AuthButton />} />

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col p-3 md:p-6 relative z-10">
        <BackButton href="/dashboard/orders" label="Volver" variant="small" className="mb-3 md:mb-5 px-3 py-1.5 md:px-4 md:py-2" />

        <AnimatePresence mode="wait">
          {/* ── ÉXITO ─────────────────────────────────────────────────────── */}
          {uploadStatus === 'success' && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <UploadSuccess
                videoUrl={order?.video_url ?? undefined}
                orderId={orderId}
                status={order?.status}
                onEdit={(targetBookingId) => handleStartEdit(targetBookingId)}
                screens={screens.map((s) => {
                  const dbBooking = order?.bookings?.find((b: any) => b.id === s.bookingId)
                  return {
                    bookingId: s.bookingId,
                    panelCode: s.panelCode,
                    panelName: s.panelName,
                    district: s.district,
                    address: s.address,
                    resolutionWidth: s.resolutionWidth,
                    resolutionHeight: s.resolutionHeight,
                    slotDurationSeconds: s.slotDurationSeconds,
                    videoUrl: mediaMap[s.bookingId]?.previewUrl || dbBooking?.video_url || s.videoUrl || order?.video_url,
                  }
                })}
              />
            </motion.div>
          )}

          {/* ── SUBIENDO A BUCKET ────────────────────────────────────────── */}
          {uploadStatus === 'uploading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center justify-center min-h-[500px]"
            >
              <UploadLoading progress={progress} stage="uploading" />
            </motion.div>
          )}

          {/* ── FLUJO IDLE A 2 COLUMNAS (IZQUIERDA: FLUJO PRINCIPAL Y CARGA, DERECHA: INFO Y RESUMEN) ── */}
          {uploadStatus === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full"
            >
              {/* ── COLUMNA IZQUIERDA (FLUJO DE CARGA Y UBICACIONES INDEPENDIENTES) ──── */}
              <div className="lg:col-span-8 flex flex-col space-y-5">

                {/* Banner de Modo Edición */}
                {isEditing && (
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                        <Pencil size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                            Modo Edición
                          </span>
                          <span className="text-xs font-mono font-bold text-muted-foreground">
                            #{orderId?.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-foreground leading-tight mt-0.5">
                          Reemplazar o cambiar videos de tu campaña
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          Sube un nuevo archivo en la pantalla que deseas actualizar. Los videos no modificados se conservarán.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="text-xs font-bold border-border/80 hover:bg-muted/50 h-9 shrink-0"
                    >
                      Cancelar edición
                    </Button>
                  </div>
                )}

                {/* 1. Header Card con Specs y Transmisión */}
                <div className="bg-card/70 border border-border/60 p-5 sm:p-6 rounded-2xl backdrop-blur-md shadow-sm space-y-3.5">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] border border-primary/20">
                      <Rocket size={10} />
                      Pedido #{orderId?.slice(0, 8).toUpperCase()}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                      {isEditing ? 'Editar spot promocional' : 'Tu spot promocional'}
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium">
                      {screens.length > 1
                        ? `Tu pedido tiene ${screens.length} pantallas contratadas. Sube el material correspondiente para cada una o aplica a todas.`
                        : `Sube tu material publicitario para tu pantalla contratada.`}
                    </p>
                  </div>

                  {/* Observed alert if any */}
                  {order?.status === 'REJECTED' && order.rejection_reason && (
                    <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold flex items-start gap-2.5 shadow-sm">
                      <span className="shrink-0 text-base">⚠️</span>
                      <div>
                        <p className="font-extrabold uppercase tracking-wide text-[10px] opacity-90 mb-0.5">
                          Observación del gestor:
                        </p>
                        <p className="leading-relaxed font-medium">{order.rejection_reason}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Sección de Pantallas Independientes */}
                <div className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                    <h3 className="text-xs font-black flex items-center gap-2 text-foreground uppercase tracking-wider">
                      <Layers size={15} className="text-primary" />
                      Pantallas en este pedido ({screens.length})
                    </h3>

                    {screens.length > 1 && (
                      <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer text-muted-foreground hover:text-foreground">
                        <Checkbox
                          checked={applyToAllScreens}
                          onChange={(e) => setApplyToAllScreens(e.target.checked)}
                        />
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-primary" />
                          Aplicar archivo cargado a todas las {screens.length} pantallas
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Lista de Cards de Pantallas (Cada pantalla con su dropzone/video preview completo) */}
                  <div className="space-y-4">
                    {screens.map((scr, idx) => (
                      <ScreenMediaCard
                        key={scr.bookingId}
                        screen={scr}
                        media={mediaMap[scr.bookingId] || { file: null, fileType: null, processedBlob: null, previewUrl: null, status: 'idle' }}
                        onFileSelect={(file, type) => handleFileSelectedForScreen(file, type, scr)}
                        onRemoveMedia={() => handleRemoveMedia(scr.bookingId)}
                        onRestoreOriginal={() => handleRestoreOriginal(scr.bookingId)}
                        totalScreens={screens.length}
                        index={idx}
                      />
                    ))}
                  </div>
                </div>

                {/* 3. Consent Checkboxes y Botones de Acción */}
                <div className="bg-card/70 border border-border/60 p-5 rounded-2xl backdrop-blur-md shadow-sm space-y-4">
                  <ConsentCheckboxes
                    acceptedTerms={acceptedTerms}
                    setAcceptedTerms={setAcceptedTerms}
                    acceptedNoLogos={acceptedNoLogos}
                    setAcceptedNoLogos={setAcceptedNoLogos}
                    userType={userType}
                    onOpenTermsModal={() => setTermsModalOpen(true)}
                    onOpenLogosModal={() => setLogosModalOpen(true)}
                  />

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full">
                    <Button
                      disabled={!allScreensReady || !acceptedTerms || !acceptedNoLogos}
                      onClick={handleSubmitOrderMedia}
                      size="xl"
                      className="w-full sm:flex-1 font-black text-sm shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4)] h-12"
                    >
                      <Send size={15} className="mr-2" />
                      <span>
                        {!allScreensReady
                          ? screens.length > 1 ? 'Primero sube el material para todas las pantallas' : 'Primero selecciona tu archivo'
                          : (!acceptedTerms || !acceptedNoLogos)
                            ? 'Marca las casillas de verificación'
                            : isEditing
                              ? 'Guardar y Enviar nuevos videos'
                              : 'Enviar mi propuesta / Anuncio'}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => isEditing ? handleCancelEdit() : router.push('/dashboard/orders')}
                      size="xl"
                      className="w-full sm:w-auto font-bold text-sm border-2 h-12 px-6"
                    >
                      {isEditing ? 'Cancelar edición' : 'Cancelar'}
                    </Button>
                  </div>
                </div>

              </div>

              {/* ── COLUMNA DERECHA (INFO DE APOYO, REGLAS Y RESUMEN) ─────────── */}
              <div className="lg:col-span-4 flex flex-col space-y-4 lg:sticky lg:top-24 lg:self-start">

                {/* Resumen Financiero del Pedido */}
                <div className="bg-card/70 border border-border/60 p-5 rounded-2xl backdrop-blur-md shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText size={13} className="text-primary" /> Resumen del Pedido
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {screens.length} {screens.length === 1 ? 'pantalla' : 'pantallas'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Total contratado:</span>
                      <strong className="text-sm font-black text-foreground">
                        S/ {order?.total_amount ? order.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '0.00'}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Ubicaciones:</span>
                      <span className="font-semibold text-foreground truncate max-w-[160px]">
                        {screens.map(s => s.district || s.panelCode).filter(Boolean).join(', ') || 'Varios'}
                      </span>
                    </div>

                    {order?.created_at && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Fecha de compra:</span>
                        <span className="font-medium text-foreground">
                          {new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <Link
                      href={`/dashboard/orders/${orderId}/resumen`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-black uppercase tracking-wider transition-colors"
                    >
                      <Download size={14} />
                      Descargar PDF de Campaña
                    </Link>
                  </div>
                </div>

                {/* Card de Reglas Importantes */}
                <div className="bg-card/70 border border-border/60 p-5 rounded-2xl backdrop-blur-md shadow-sm">
                  <ImportantNote userType={userType} />
                </div>

              </div>

              {/* Modal Crop Editor for Images */}
              {cropModalOpen && currentPhotoObjectUrl && activeCropScreen && (
                <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-card border border-border rounded-2xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <Sparkles size={18} className="text-primary" />
                      Recortar imagen para pantalla ({activeCropScreen.resolutionWidth}×{activeCropScreen.resolutionHeight})
                    </h3>
                    <PhotoCropEditor
                      imageSrc={currentPhotoObjectUrl}
                      aspectRatio={activeCropScreen.resolutionWidth / activeCropScreen.resolutionHeight}
                      onCropComplete={handleCropConfirmed}
                      onCancel={() => {
                        setCropModalOpen(false)
                        setCurrentPhotoFile(null)
                        if (currentPhotoObjectUrl) URL.revokeObjectURL(currentPhotoObjectUrl)
                        setCurrentPhotoObjectUrl(null)
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Frame Selector for Images */}
              {frameModalOpen && (
                <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-card border border-border rounded-2xl p-4 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <FrameSelector
                      previewSrc={croppedPreviewUrl ?? currentPhotoObjectUrl ?? ''}
                      selectedFrameId={selectedFrame.id}
                      onSelectFrame={setSelectedFrame}
                      onEditCrop={() => {
                        setFrameModalOpen(false)
                        setCropModalOpen(true)
                      }}
                    />
                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setFrameModalOpen(false)}
                        className="flex-1 font-bold text-xs uppercase"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleFrameConfirmed}
                        className="flex-1 font-black text-xs uppercase shadow-lg"
                      >
                        Confirmar y Convertir
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Consent Modals */}
      <ScrollToAcceptModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => setAcceptedTerms(true)}
        title="Normas de uso y condiciones de JMT"
      >
        <div className="space-y-4 text-justify">
          <p className="font-semibold text-foreground">
            Bienvenido al servicio de publicación en las pantallas digitales de JMT. Antes de subir tu anuncio, debes aceptar nuestras normas de uso descritas a continuación:
          </p>
          <div className="space-y-2">
            <h4 className="font-bold text-foreground">1. Horarios y Frecuencia de Transmisión</h4>
            <p>
              La transmisión de tu anuncio se realiza de manera rotativa e ininterrumpida dentro del horario operativo especificado para la pantalla seleccionada. El tiempo mínimo de duración de cada spot es de 7 segundos, reproduciéndose en un bucle dinámico junto a las otras campañas activas.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-foreground">2. Proceso de Moderación y Aprobación</h4>
            <p>
              Todo el material subido es evaluado por nuestro equipo de moderación en un plazo máximo de 24 horas. Nos reservamos el derecho de rechazar anuncios que no cumplan con los estándares técnicos (resolución, formato) o de contenido requeridos.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-foreground">3. Cumplimiento de Normas Técnicas</h4>
            <p>
              Es responsabilidad del usuario asegurarse de que las imágenes y videos cargados coincidan con las dimensiones de la pantalla contratada. El sistema recortará o adaptará el archivo de forma automática manteniendo su aspect ratio para evitar deformaciones visuales.
            </p>
          </div>
        </div>
      </ScrollToAcceptModal>

      <ScrollToAcceptModal
        isOpen={logosModalOpen}
        onClose={() => setLogosModalOpen(false)}
        onAccept={() => setAcceptedNoLogos(true)}
        title="Autoría de material y reglas de rechazo"
      >
        {getLogosModalContent()}
      </ScrollToAcceptModal>
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
