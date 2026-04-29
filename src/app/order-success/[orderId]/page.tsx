'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2, Send, Rocket, ShieldCheck, Clock, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'

import { createClient } from '@/lib/supabase/client'

// Modulares componentes
import { UploadDropzone } from '@/components/upload/UploadDropzone'
import { UploadFallback } from '@/components/upload/UploadFallback'
import { UploadLoading } from '@/components/upload/UploadLoading'
import { UploadSuccess } from '@/components/upload/UploadSuccess'

export default function OrderSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const [file, setFile] = useState<File | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (data) {
          setOrder(data)
          // If video is already sent or in validation, show success state (preview)
          if ((data.status === 'VIDEO_SENT' || data.status === 'PENDING_VALIDATION' || data.video_url) && data.status !== 'REJECTED') {
            setUploadStatus('success')
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const handleUpload = async () => {
    if (!file) return

    setUploadStatus('uploading')
    setUploadProgress(0)

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return 90
        return prev + Math.random() * 8
      })
    }, 400)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('orderId', orderId)

      const res = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      const data = await res.json()

      if (!res.ok || data.error) {
        console.error('Upload error:', data.error)
        alert(data.error || 'Ocurrió un error al subir el video. Por favor intenta nuevamente.')
        setUploadStatus('idle')
        return
      }

      // Update local order state with new video URL
      setOrder((prev: any) => ({
        ...prev,
        video_url: data.videoUrl,
        status: 'VIDEO_SENT'
      }))

      setUploadProgress(100)
      setTimeout(() => {
        setUploadStatus('success')
      }, 500)

    } catch (err) {
      clearInterval(progressInterval)
      console.error('Upload Error:', err)
      alert('Ocurrió un error inesperado al subir el video.')
      setUploadStatus('idle')
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 pt-12 md:pt-16 overflow-x-hidden">
      <TopBar
        right={<AuthButton />}
      />

      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col p-4 md:p-6 relative z-10">
        {/* Botón Volver - Standardized with Checkout */}
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="w-fit flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border shadow-sm hover:bg-muted transition-all active:scale-95 group text-[10px] md:text-xs font-bold mb-2 md:mb-4"
        >
          <ArrowLeft size={14} className="text-primary group-hover:-translate-x-1 transition-transform" />
          <span className="text-muted-foreground group-hover:text-foreground">Volver a Pedidos</span>
        </button>

        <AnimatePresence mode="wait">
          {uploadStatus === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col lg:grid lg:grid-cols-12 gap-8 w-full"
            >
              {/* LEFT SECTION: Upload Video */}
              <section className="lg:col-span-8 flex flex-col bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />

                <div className="relative z-10 space-y-1 md:space-y-2 mb-4 md:mb-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20"
                  >
                    <Rocket size={10} />
                    Pedido #{orderId?.slice(0, 8).toUpperCase()}
                  </motion.div>

                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-tight uppercase max-w-xl">
                    SUBE TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 italic">MATERIAL</span>
                  </h1>
                  <p className="text-xs md:text-base text-muted-foreground max-w-md font-medium leading-relaxed opacity-80">
                    Finaliza tu campaña subiendo el video publicitario.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                  {[
                    { label: 'Resolución', val: '720x1280', icon: ShieldCheck },
                    { label: 'Duración', val: '7 Seg', icon: Clock },
                    { label: 'Formato', val: 'MP4', icon: CheckCircle2 },
                    { label: 'Peso Máx', val: '50MB', icon: ShieldCheck }
                  ].map((spec, i) => (
                    <div key={i} className="bg-background/40 border border-border/40 px-3 py-2 rounded-xl flex items-center gap-2 flex-1 min-w-[120px] md:min-w-0">
                      <spec.icon size={12} className="text-primary/60" />
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground/60">{spec.label}</span>
                        <span className="text-[10px] md:text-xs font-black">{spec.val}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <UploadDropzone
                  file={file}
                  setFile={setFile}
                />

                <div className="pt-4 md:pt-6 flex flex-col sm:flex-row items-center gap-4">
                  <motion.button
                    whileHover={file ? { scale: 1.01 } : {}}
                    whileTap={file ? { scale: 0.98 } : {}}
                    disabled={!file}
                    onClick={handleUpload}
                    className={`w-full sm:w-fit flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl backdrop-blur-sm border transition-all active:scale-95 group text-sm font-bold shadow-sm
                      ${file
                        ? 'bg-card/50 border-border hover:bg-muted hover:border-primary/20 text-foreground cursor-pointer'
                        : 'bg-muted/20 border-border/20 text-muted-foreground cursor-not-allowed opacity-50'
                      }`}
                  >
                    <Send size={18} className={file ? "text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" : ""} />
                    <span>Enviar Material</span>
                  </motion.button>

                </div>
              </section>

              {/* RIGHT SECTION: Fallback/Share */}
              <aside className="lg:col-span-4 h-full">
                <UploadFallback orderId={orderId} />
              </aside>
            </motion.div>
          )}

          {/* LOADING STATE */}
          {uploadStatus === 'uploading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center justify-center min-h-[500px]"
            >
              <UploadLoading progress={uploadProgress} />
            </motion.div>
          )}

          {/* SUCCESS STATE */}
          {uploadStatus === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <UploadSuccess
                videoUrl={order?.video_url}
                orderId={orderId}
                status={order?.status}
              />
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
