'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Check, MessageSquare, Mail, ArrowLeft, Link2, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function UploadFallback({ orderId }: { orderId: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const text = `¡Hola! Aquí tienes el enlace para subir el video de tu campaña en JMT (Pedido #${orderId?.slice(0, 8)}): ${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const shareGmail = () => {
    const subject = `Subir video para Pedido #${orderId?.slice(0, 8)} - JMT Marketplace`
    const body = `Hola,\n\nPuedes subir el video de tu campaña publicitaria usando el siguiente enlace:\n\n${window.location.href}\n\nRecuerda las especificaciones:\n- Formato: MP4 / 1280x720\n- Duración: 7 segundos máx.\n- Peso: 50MB máx.`
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  return (
    <section className="w-full flex flex-col gap-6">
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-lg p-8 md:p-10 flex flex-col relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-full -z-10 blur-3xl" />
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20">
            <Link2 size={24} />
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Compartir Enlace</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-10 leading-relaxed font-medium">
          ¿No tienes el video a mano? Envía este enlace seguro a tu equipo creativo o guárdalo para subirlo después.
        </p>
        
        <div className="flex flex-wrap gap-3 mt-auto relative z-10">
          <button 
            onClick={copyToClipboard} 
            className="w-fit flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-card/50 backdrop-blur-sm border border-border shadow-sm hover:bg-muted hover:border-primary/20 transition-all active:scale-95 group text-sm font-semibold"
          >
            {copied ? (
              <Check size={18} className="text-emerald-500 animate-in zoom-in" />
            ) : (
              <Copy size={18} className="text-primary group-hover:text-foreground transition-colors" />
            )}
            <span className="text-muted-foreground group-hover:text-foreground">
              {copied ? 'Copiado' : 'Copiar Enlace'}
            </span>
          </button>

          <button 
            onClick={shareWhatsApp} 
            className="w-fit flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-card/50 backdrop-blur-sm border border-border shadow-sm hover:bg-muted hover:border-primary/20 transition-all active:scale-95 group text-sm font-semibold"
          >
            <MessageSquare size={18} className="text-emerald-500" />
            <span className="text-muted-foreground group-hover:text-foreground">WhatsApp</span>
          </button>

          <button 
            onClick={shareGmail} 
            className="w-fit flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-card/50 backdrop-blur-sm border border-border shadow-sm hover:bg-muted hover:border-primary/20 transition-all active:scale-95 group text-sm font-semibold"
          >
            <Mail size={18} className="text-red-500" />
            <span className="text-muted-foreground group-hover:text-foreground">Gmail</span>
          </button>
        </div>
      </div>


    </section>
  )
}
