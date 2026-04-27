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
      <TopBar>
        <AuthButton />
      </TopBar>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        {/* Icon & Title */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(98,174,64,0.2)]">
            <CheckCircle2 size={48} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-center">
            Pago Realizado
          </h1>
        </motion.div>

        {/* Map Placeholder / Info Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full aspect-video bg-[#131b2f] border border-slate-800/60 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
          <div className="text-center z-10">
            <p className="text-4xl font-black text-slate-800 uppercase tracking-[0.2em] select-none opacity-20">Mapa</p>
          </div>
        </motion.div>

        {/* Video Specs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full border border-slate-800/60 rounded-lg p-6 mb-8 text-center"
        >
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Especificaciones de video<br />
            Formato MP4 - 7 segundos - 1280X720 - Maximo 50mb
          </p>
        </motion.div>

        {/* Acceptance Checkbox */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 mb-8 w-full group cursor-pointer"
          onClick={() => setAccepted(!accepted)}
        >
          <div className={`w-6 h-6 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${accepted ? 'bg-primary border-primary shadow-[0_0_10px_rgba(98,174,64,0.3)]' : 'border-slate-700 bg-slate-800/50'}`}>
            {accepted && <Check size={14} className="text-white" strokeWidth={4} />}
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-normal group-hover:text-slate-300 transition-colors">
            Este primero debe de ser aceptado y valido para empezar la campaña
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={accepted ? { scale: 1.02 } : {}}
          whileTap={accepted ? { scale: 0.98 } : {}}
          disabled={!accepted}
          className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-xl ${accepted 
            ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20' 
            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Upload size={18} />
            <span>Enviar contenido</span>
          </div>
        </motion.button>

        {/* Footer Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">
            No cuentas con el video ahora, realiza esto despues:
          </p>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-bold text-sm mx-auto"
          >
            {copied ? (
              <div className="flex items-center gap-2 text-green-400">
                <Check size={16} />
                <span>¡Enlace copiado!</span>
              </div>
            ) : (
              <>
                <Copy size={16} />
                <span>Copiar enlace seguro</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </main>
  )
}
