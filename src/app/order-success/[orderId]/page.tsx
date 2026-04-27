'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2, Copy, Share2, Upload, Map as MapIcon, Check, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'

export default function OrderSuccessPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [accepted, setAccepted] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchOrder = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          bookings (
            id,
            panel_id,
            panels (
              panel_code,
              structure_id,
              structures (
                address,
                district
              )
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) {
        console.error(error)
        // router.push('/')
      } else {
        setOrder(data)
      }
      setLoading(false)
    }

    if (orderId) fetchOrder()
  }, [orderId])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0f1d] text-white flex flex-col">
      <TopBar right={<AuthButton />} />

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        {/* Icon & Title */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-[#62ae40] rounded-2xl flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(98,174,64,0.3)]">
            <CheckCircle2 size={36} className="text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-center text-white">
            Pago Realizado
          </h1>
        </motion.div>

        {/* Map Placeholder / Info Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full aspect-video bg-[#0d1326] border border-white/5 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          <div className="text-center z-10">
            <p className="text-3xl font-black text-white/5 uppercase tracking-[0.25em] select-none">Mapa</p>
          </div>
        </motion.div>

        {/* Video Specs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full border border-white/10 rounded-xl p-5 mb-8 text-center bg-white/5 backdrop-blur-md"
        >
          <p className="text-[11px] md:text-xs text-slate-300 font-bold uppercase tracking-widest mb-1.5 opacity-60">
            Especificaciones de video
          </p>
          <p className="text-xs md:text-sm text-white font-medium">
            Formato MP4 - 7 segundos - 1280X720 - Máximo 50mb
          </p>
        </motion.div>

        {/* Acceptance Checkbox */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4 mb-10 w-full group cursor-pointer items-start"
          onClick={() => setAccepted(!accepted)}
        >
          <div className={`w-6 h-6 rounded-md border flex-shrink-0 flex items-center justify-center transition-all duration-300 ${accepted ? 'bg-primary border-primary shadow-[0_0_15px_rgba(98,174,64,0.4)]' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
            {accepted && <Check size={14} className="text-white" strokeWidth={4} />}
          </div>
          <p className="text-[11px] md:text-xs text-slate-400 font-medium leading-relaxed group-hover:text-slate-200 transition-colors">
            Este primero debe de ser aceptado y valido para empezar la campaña
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={accepted ? { scale: 1.02, backgroundColor: '#73c34d' } : {}}
          whileTap={accepted ? { scale: 0.98 } : {}}
          disabled={!accepted}
          className={`w-full py-4.5 rounded-xl font-black uppercase tracking-[0.15em] text-sm transition-all shadow-2xl ${accepted 
            ? 'bg-[#62ae40] text-white shadow-primary/20' 
            : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}`}
        >
          <div className="flex items-center justify-center gap-3">
            <Upload size={18} />
            <span>Enviar contenido</span>
          </div>
        </motion.button>

        {/* Footer Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-14 text-center"
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-5 opacity-70">
            No cuentas con el video ahora, realiza esto después:
          </p>
          <button 
            onClick={copyToClipboard}
            className="group flex items-center gap-3 text-[#62ae40] hover:text-[#73c34d] transition-all font-black text-sm mx-auto py-2 px-4 rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/10"
          >
            {copied ? (
              <div className="flex items-center gap-2 text-green-400">
                <Check size={16} strokeWidth={3} />
                <span className="uppercase tracking-wider">¡Copiado!</span>
              </div>
            ) : (
              <>
                <div className="w-2 h-4 bg-primary rounded-sm group-hover:scale-y-110 transition-transform" />
                <span className="uppercase tracking-wider">Copiar enlace seguro</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </main>
  )
}
