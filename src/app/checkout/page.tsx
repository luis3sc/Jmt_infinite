'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'

export default function CheckoutPage() {
  const router = useRouter()
  const cartItems = useCartStore((state) => state.items)
  const cartTotal = useCartStore((state) => state.getTotalPrice())
  
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [receiptType, setReceiptType] = useState<'boleta' | 'factura'>('boleta')
  const [docType, setDocType] = useState('DNI')

  // Prevent hydration errors by only rendering cart data after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // If cart is empty and component is mounted, we might want to redirect back
  // but for now let's just let it be or show a message.

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    // Here we would integrate Supabase Auth (implicit signup) and Culqi payment
    // For now, mock the process:
    setTimeout(() => {
      setLoading(false)
      // Redirect to success or handle payment response
      // router.push('/success')
      alert("Procesando pago con Culqi...")
    }, 1500)
  }

  if (!isMounted) return null

  return (
    <div className="min-h-[100dvh] bg-[#0a0f1c] text-slate-200 flex flex-col">
      <TopBar 
        showBackButton={true}
        onBack={() => router.back()}
        center={
          <h1 className="text-xs md:text-sm font-bold text-white uppercase tracking-[0.2em] hidden sm:block">
            Confirmación y pago
          </h1>
        }
        right={<AuthButton />}
      />
      
      <div className="flex-1 flex flex-col md:flex-row pt-14 md:pt-16 overflow-hidden relative">
      
      {/* SECCIÓN IZQUIERDA: FORMULARIO */}
      <div className="flex-1 px-4 py-6 md:p-10 md:max-w-2xl md:mx-auto md:w-full overflow-y-auto custom-scrollbar">
        <div className="md:hidden mb-6">
          <h1 className="text-xl font-bold text-white tracking-wide">Confirmación y pago</h1>
        </div>


        <h2 className="text-2xl md:text-3xl font-light text-white mb-6 tracking-tight">Crear Cuenta</h2>
        
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              required
              className="w-full bg-[#131b2f] border border-slate-800/60 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#62ae40] focus:ring-1 focus:ring-[#62ae40] transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
              Contraseña
            </label>
            <input 
              type="password" 
              required
              className="w-full bg-[#131b2f] border border-slate-800/60 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#62ae40] focus:ring-1 focus:ring-[#62ae40] transition-all"
            />
          </div>

          {/* Tipo de Comprobante (Toggle) */}
          <div className="grid grid-cols-2 gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={() => setReceiptType('boleta')}
              className={`py-3 rounded-lg text-sm font-bold tracking-wider uppercase transition-colors ${
                receiptType === 'boleta' 
                  ? 'bg-[#62ae40] text-white shadow-[0_0_15px_rgba(98,174,64,0.3)]' 
                  : 'bg-[#131b2f] text-slate-400 border border-slate-800/60 hover:bg-slate-800/40'
              }`}
            >
              Boleta
            </button>
            <button
              type="button"
              onClick={() => setReceiptType('factura')}
              className={`py-3 rounded-lg text-sm font-bold tracking-wider uppercase transition-colors ${
                receiptType === 'factura' 
                  ? 'bg-[#62ae40] text-white shadow-[0_0_15px_rgba(98,174,64,0.3)]' 
                  : 'bg-[#131b2f] text-slate-400 border border-slate-800/60 hover:bg-slate-800/40'
              }`}
            >
              Factura
            </button>
          </div>

          {/* Documento */}
          <div className="flex gap-3">
            <div className="w-1/3 md:w-1/4">
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                Tipo
              </label>
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-[#131b2f] border border-slate-800/60 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-[#62ae40] focus:ring-1 focus:ring-[#62ae40] transition-all appearance-none"
              >
                {receiptType === 'factura' ? (
                  <option value="RUC">RUC</option>
                ) : (
                  <>
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </>
                )}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                {receiptType === 'factura' ? 'Número de RUC' : `Número de ${docType}`}
              </label>
              <input 
                type="text" 
                required
                className="w-full bg-[#131b2f] border border-slate-800/60 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#62ae40] focus:ring-1 focus:ring-[#62ae40] transition-all"
              />
            </div>
          </div>

          {/* Nombres y Apellidos / Razón Social */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
              {receiptType === 'factura' ? 'Razón Social' : 'Nombres y Apellidos'}
            </label>
            <input 
              type="text" 
              required
              className="w-full bg-[#131b2f] border border-slate-800/60 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#62ae40] focus:ring-1 focus:ring-[#62ae40] transition-all"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
              Teléfono
            </label>
            <div className="flex gap-2">
              <select className="bg-[#131b2f] border border-slate-800/60 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-[#62ae40] appearance-none w-20 text-center">
                <option value="+51">+51</option>
                <option value="+1">+1</option>
                <option value="+34">+34</option>
                <option value="+52">+52</option>
                <option value="+54">+54</option>
                <option value="+56">+56</option>
                <option value="+57">+57</option>
              </select>
              <input 
                type="tel" 
                required
                className="flex-1 bg-[#131b2f] border border-slate-800/60 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#62ae40] focus:ring-1 focus:ring-[#62ae40] transition-all"
              />
            </div>
          </div>
          
          <div className="h-80 md:hidden"></div> {/* Aumentado para asegurar que el input de teléfono sea visible sobre el footer fijo */}

        </form>
      </div>

      {/* SECCIÓN DERECHA: RESUMEN Y PAGO (Fixed bottom on mobile, side panel on desktop) */}
      <div className="fixed bottom-0 left-0 w-full md:relative md:w-[400px] lg:w-[480px] bg-[#0d1326] md:bg-black/20 border-t md:border-t-0 md:border-l border-slate-800/50 p-5 md:p-8 shrink-0 flex flex-col shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.5)] md:shadow-none z-20">
        
        {/* Resumen Desktop (Items) */}
        <div className="hidden md:block flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Resumen del Pedido</h3>
          {cartItems.length === 0 ? (
            <p className="text-slate-500 text-sm italic">Tu carrito está vacío.</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.panelId} className="flex justify-between items-start pb-4 border-b border-slate-800/50 last:border-0">
                  <div className="pr-4">
                    <p className="font-bold text-sm text-white uppercase tracking-tight">{item.panelCode}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.address}</p>
                    <div className="flex gap-2 items-center mt-2">
                      <span className="text-[10px] font-black text-[#62ae40] bg-[#62ae40]/10 px-1.5 py-0.5 rounded uppercase">{item.days} días</span>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-white whitespace-nowrap">
                    S/ {item.totalPrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total a pagar</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-black text-[#62ae40] tracking-tighter">
                  S/ {Math.floor(cartTotal).toLocaleString()}
                </span>
                <span className="text-sm md:text-lg font-black text-[#62ae40] opacity-70">
                  .{(cartTotal % 1).toFixed(2).split('.')[1]}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] md:text-xs font-bold text-[#62ae40] uppercase tracking-wider">
                PRECIO X DÍAS
              </p>
            </div>
          </div>

          <button 
            type="submit"
            form="checkout-form"
            disabled={loading || cartItems.length === 0}
            className="w-full bg-[#62ae40] hover:bg-[#529b32] text-white py-4 rounded-xl font-black text-sm md:text-base uppercase tracking-widest transition-all shadow-[0_10px_25px_-5px_rgba(98,174,64,0.4)] active:scale-[0.98] flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <CreditCard size={20} />
                Confirmar y pagar
              </>
            )}
          </button>
          
          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
              <span>Pagos seguros procesados por</span>
              <strong className="text-white/80">Culqi</strong>
            </p>
          </div>
        </div>
      </div>

      </div>
    </div>
  )
}
