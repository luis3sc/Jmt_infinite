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
import { UploadFallback } from '@/components/upload/UploadFallback'
import { UploadLoading } from '@/components/upload/UploadLoading'
import { UploadSuccess } from '@/components/upload/UploadSuccess'
import { UploadTypeSelector } from '@/components/upload/UploadTypeSelector'
import { PhotoDropzone } from '@/components/upload/PhotoDropzone'
import { PhotoCropEditor } from '@/components/upload/PhotoCropEditor'
import { FrameSelector, AVAILABLE_FRAMES } from '@/components/upload/FrameSelector'
import type { Frame } from '@/components/upload/FrameSelector'

// Libs
import { composeImage } from '@/lib/imageComposer'
import { processVideo } from '@/lib/ffmpegClient'
import { analyzeVideoFile, isAspectRatioCompatible } from '@/lib/videoAnalyzer'

// ─── Tipos locales ──────────────────────────────────────────────────────────

type ContentType = 'idle' | 'photo' | 'video'
type UploadStatus = 'idle' | 'processing' | 'uploading' | 'success'

interface Order {
  id: string
  status: string
  video_url: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VIDEO_SPECS = [
  { label: 'Resolución', val: '1280×720', icon: ShieldCheck },
  { label: 'Duración', val: '7 Seg', icon: Clock },
  { label: 'Formato', val: 'MP4', icon: CheckCircle2 },
  { label: 'Peso Máx', val: '50MB', icon: ShieldCheck },
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

  // Fetch order on mount
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('orders')
          .select('id, status, video_url, user_id, profiles(user_type)')
          .eq('id', orderId)
          .single()

        if (data) {
          const profile = data.profiles as any
          if (profile?.user_type) setUserType(profile.user_type)
          setOrder(data as Order)
          // Si ya tiene video o ya pasó de PENDING_UPLOAD → mostrar éxito directamente
          if (
            (data.status === 'VIDEO_SENT' ||
              data.status === 'PENDING_VALIDATION' ||
              data.video_url) &&
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

  // ── Se eliminaron los useEffects que revocaban los Object URLs ──
  // En su lugar, el ciclo de vida de los Object URLs se maneja manualmente
  // en las acciones del usuario (handlePhotoSelected y handleCropConfirmed)
  // para evitar problemas con el Strict Mode de React.

  // ── Subida final a R2 usando XHR para progreso real ──────────────────────
  async function uploadBlobToServer(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      // Usar la extensión correcta según el tipo de blob para que el servidor identifique el formato
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpg' : 'mp4'
      formData.append('file', blob, `creative-${orderId}.${ext}`)
      formData.append('orderId', orderId)

      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText)
          setOrder((prev) => prev ? { ...prev, video_url: data.videoUrl, status: 'VIDEO_SENT' } : prev)
          resolve()
        } else {
          const data = JSON.parse(xhr.responseText)
          reject(new Error(data.error || 'Error al subir el archivo.'))
        }
      }

      xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'))
      xhr.open('POST', '/api/upload-video')
      xhr.send(formData)
    })
  }

  // ── Flujo de VIDEO ───────────────────────────────────────────────────────
  async function handleVideoUpload() {
    if (!videoFile) return
    setProgress(0)

    // Análisis rápido de aspect ratio (no bloqueante)
    try {
      const meta = await analyzeVideoFile(videoFile)
      const panelRatio = 16 / 9
      if (!isAspectRatioCompatible(meta.aspectRatio, panelRatio)) {
        const ok = window.confirm(
          `El aspect ratio de tu video (${meta.width}×${meta.height}) no coincide exactamente con el panel (16:9).\n\nEl sistema lo ajustará automáticamente con barras negras. ¿Continuar?`
        )
        if (!ok) return
      }
    } catch {
      // Si falla el análisis, continuamos igual
    }

    try {
      // 1. Procesamiento client-side con ffmpeg.wasm
      setUploadStatus('processing')
      const processed = await processVideo(videoFile, 1280, 720, (p) => setProgress(p))

      // 2. Subida a R2
      setUploadStatus('uploading')
      setProgress(0)
      await uploadBlobToServer(processed)

      setProgress(100)
      setTimeout(() => setUploadStatus('success'), 400)
    } catch (err) {
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
    setProgress(0)

    try {
      // 1. Composición: crop + marco en canvas (client-side, sin FFmpeg)
      setUploadStatus('processing')
      setProgress(15)
      console.log('[upload] Paso 1: composición de imagen...')

      const composedBlob = await composeImage(
        photoObjectUrl,
        croppedArea,
        selectedFrame.src || null,
        1280,
        720
      )
      console.log('[upload] Paso 1 OK — composedBlob size:', composedBlob.size, 'type:', composedBlob.type)
      setProgress(30)

      // 2. Subir PNG al servidor — el servidor convierte a video MP4 con fluent-ffmpeg
      // No se usa FFmpeg.wasm en el cliente (evita problemas de SharedArrayBuffer/Turbopack)
      console.log('[upload] Paso 2: subiendo PNG al servidor para conversión a video...')
      setUploadStatus('uploading')
      await uploadBlobToServer(composedBlob)

      setProgress(100)
      console.log('[upload] Paso 2 OK — proceso completo')
      setTimeout(() => setUploadStatus('success'), 400)
    } catch (err) {
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
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="w-fit flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border shadow-sm hover:bg-muted transition-all active:scale-95 group text-[10px] md:text-xs font-bold mb-2 md:mb-4"
        >
          <ArrowLeft size={14} className="text-primary group-hover:-translate-x-1 transition-transform" />
          <span className="text-muted-foreground group-hover:text-foreground">Volver a Pedidos</span>
        </button>

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
          {(uploadStatus === 'processing' || uploadStatus === 'uploading') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center justify-center min-h-[500px]"
            >
              <UploadLoading progress={progress} stage={uploadStatus} />
            </motion.div>
          )}

          {/* ── FLUJO IDLE ────────────────────────────────────────────────── */}
          {uploadStatus === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 w-full"
            >
              {/* ── LEFT: Estudio de Creación ───────────────────────── */}
              <section className="lg:col-span-8 flex flex-col bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl md:rounded-[2rem] p-3 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
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
                        {userType === 'individual' ? 'Sube tu mensaje' :
                          userType === 'influencer' ? 'Tu contenido' :
                            'Tu anuncio'}{' '}

                      </h1>
                      <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground max-w-md font-medium leading-relaxed opacity-80">
                        {userType === 'individual' ? 'Comparte tu momento.' :
                          userType === 'influencer' ? 'Conecta con tu audiencia.' :
                            'Impacto visual directo.'}
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
                          {contentType === 'photo' ? 'Tu foto' : 'Tu video'}
                        </h1>
                        <p className="hidden sm:block text-[10px] sm:text-xs text-muted-foreground font-medium mt-0.5">
                          {contentType === 'photo'
                            ? 'Recorta y añade un marco'
                            : 'Optimizaremos la duración'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── SELECTOR TIPO (solo si order.status === PENDING_UPLOAD) ── */}
                {order?.status === 'PENDING_UPLOAD' && contentType === 'idle' && (
                  <div className="relative z-10">
                    <UploadTypeSelector onSelect={setContentType} />
                  </div>
                )}

                {/* ── FLUJO FOTO ─────────────────────────────────────────── */}
                {contentType === 'photo' && (
                  <div className="relative z-10 space-y-4 md:space-y-5">
                    {photoStep === 'drop' && (
                      <PhotoDropzone onFile={handlePhotoSelected} />
                    )}

                    {photoStep === 'crop' && photoObjectUrl && (
                      <PhotoCropEditor
                        imageSrc={photoObjectUrl}
                        aspectRatio={16 / 9}
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

                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePhotoUpload}
                            className="w-full sm:w-fit flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-primary text-white border border-primary/20 transition-all text-sm font-bold shadow-lg shadow-primary/20"
                          >
                            <Send size={18} />
                            <span>Enviar Material</span>
                          </motion.button>
                          <button
                            onClick={() => setPhotoStep('crop')}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            ← Volver al recorte
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── FLUJO VIDEO ─────────────────────────────────────────── */}
                {contentType === 'video' && (
                  <div className="relative z-10 space-y-4 md:space-y-5">
                    {/* Specs del panel */}
                    <div className="flex flex-wrap gap-2">
                      {VIDEO_SPECS.map((s, i) => (
                        <Spec key={i} {...s} />
                      ))}
                    </div>

                    <UploadDropzone
                      file={videoFile}
                      setFile={setVideoFile}
                    />

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                      <motion.button
                        whileHover={videoFile ? { scale: 1.01 } : {}}
                        whileTap={videoFile ? { scale: 0.98 } : {}}
                        disabled={!videoFile}
                        onClick={handleVideoUpload}
                        className={`w-full sm:w-fit flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl backdrop-blur-sm border transition-all active:scale-95 group text-sm font-bold shadow-sm
                          ${videoFile
                            ? 'bg-card/50 border-border hover:bg-muted hover:border-primary/20 text-foreground cursor-pointer'
                            : 'bg-muted/20 border-border/20 text-muted-foreground cursor-not-allowed opacity-50'
                          }`}
                      >
                        <Send size={18} className={videoFile ? 'text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform' : ''} />
                        <span>Enviar Material</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </section>

              {/* ── RIGHT: Fallback/Share ──────────────────────────────── */}
              <aside className="lg:col-span-4 h-full">
                <UploadFallback orderId={orderId} />
              </aside>
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
