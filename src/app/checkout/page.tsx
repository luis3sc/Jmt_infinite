'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CreditCard, Loader2, ChevronDown, ChevronUp, ShoppingCart, X, QrCode, CheckCircle2, Lock } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { PhoneInput, defaultCountries } from 'react-international-phone'
import 'react-international-phone/style.css'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
  const router = useRouter()
  const cartItems = useCartStore((state) => state.items)
  const cartTotal = useCartStore((state) => state.getTotalPrice())

  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [receiptType, setReceiptType] = useState<'boleta' | 'factura'>('boleta')
  const [docType, setDocType] = useState('DNI')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentTab, setPaymentTab] = useState<'card' | 'qr'>('card')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [confirmedUserId, setConfirmedUserId] = useState<string | null>(null)


  // Prevent hydration errors by only rendering cart data after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // If cart is empty and component is mounted, we might want to redirect back
  // but for now let's just let it be or show a message.

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validaciones previas
    if (!phone || phone.trim() === '' || phone.length < 9) {
      alert("Por favor, ingresa un número de teléfono válido.")
      const phoneInput = document.querySelector('.react-international-phone-input') as HTMLInputElement;
      if (phoneInput) phoneInput.focus();
      return
    }

    if (!fullName || fullName.trim() === '') {
      alert("Por favor, ingresa tu nombre completo.")
      return
    }

    if (!docNumber || docNumber.trim() === '') {
      alert("Por favor, ingresa tu número de documento.")
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      // 1. Verificar si el usuario está autenticado
      const { data: { session } } = await supabase.auth.getSession()
      let userId = session?.user?.id

      if (!userId) {
        // 2. Si no está autenticado, intentar primero INICIAR SESIÓN
        // Esto evita disparar correos de confirmación si el usuario ya existe, 
        // lo cual ayuda a evitar el "email rate limit exceeded".
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          // Si el error es "Invalid login credentials", podría ser un usuario nuevo
          if (signInError.message.toLowerCase().includes('invalid login credentials') || 
              signInError.message.toLowerCase().includes('not found')) {
            
            // Intentar registrarlo como usuario nuevo
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName,
                  phone: phone,
                }
              }
            })

            if (signUpError) {
              // Manejo específico para el límite de tasa (Rate Limit)
              if (signUpError.status === 429 || signUpError.message.toLowerCase().includes('rate limit')) {
                throw new Error("Límite de intentos excedido. Por favor, espera unos minutos o verifica la configuración de Supabase (Auth -> Rate Limits).")
              }
              throw signUpError
            }
            
            userId = signUpData.user?.id
          } else {
            // Manejo específico para el límite de tasa en el sign-in
            if (signInError.status === 429 || signInError.message.toLowerCase().includes('rate limit')) {
              throw new Error("Límite de intentos excedido. Por favor, espera unos minutos.")
            }
            throw signInError
          }
        } else {
          userId = signInData.user?.id
        }
      }

      if (!userId) throw new Error("No se pudo identificar al usuario. Si te acabas de registrar, revisa tu correo para confirmar la cuenta.")

      // 3. Refrescar la sesión para garantizar que auth.uid() esté disponible en RLS
      await supabase.auth.refreshSession()

      // 4. Crear o actualizar perfil en la tabla 'profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        // Error 42501 = RLS violation. No es crítico para la reserva, solo lo logueamos.
        console.warn("Advertencia al guardar perfil:", profileError.message)
      }

      // 4. Guardar userId y mostrar modal de pago
      setConfirmedUserId(userId)
      setShowPaymentModal(true)

    } catch (err: any) {
      console.error(err)
      alert(err.message || "Ocurrió un error durante el proceso")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!confirmedUserId) return
    setPaymentLoading(true)
    const supabase = createClient()
    try {
      if (cartItems.length > 0) {
        const bookings = cartItems.map(item => ({
          user_id: confirmedUserId,
          panel_id: item.panelId,
          client_name: fullName,
          start_date: item.startDate,
          end_date: item.endDate,
          amount: item.totalPrice,
          status: 'CONFIRMED'
        }))
        const { error: bookingError } = await supabase.from('bookings').insert(bookings)
        if (bookingError) throw bookingError
      }
      setShowPaymentModal(false)
      router.push('/?reserva=ok')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Error al procesar el pago')
    } finally {
      setPaymentLoading(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="min-h-[100dvh] bg-[#0a0f1c] text-slate-200 flex flex-col">
      <TopBar
        center={
          <h1 className="text-xs md:text-sm font-bold text-white uppercase tracking-[0.2em] hidden sm:block">
            Confirmación y pago
          </h1>
        }
        right={<AuthButton />}
      />

      <div className="flex-1 flex flex-col md:flex-row pt-14 md:pt-16 overflow-hidden relative">

        {/* SECCIÓN IZQUIERDA: FORMULARIO */}
        <div className="flex-1 px-4 pt-4 pb-24 md:p-10 md:max-w-2xl md:mx-auto md:w-full overflow-y-auto custom-scrollbar">
          {/* Botón Volver */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card/50 backdrop-blur-sm border border-border shadow-sm hover:bg-muted hover:border-primary/20 transition-all active:scale-95 group text-sm font-semibold mb-8"
          >
            <ArrowLeft size={18} className="text-primary group-hover:-translate-x-1 transition-transform" />
            <span className="text-muted-foreground group-hover:text-foreground">Volver</span>
          </button>

          {/* RESUMEN COLLAPSABLE (Solo Mobile) */}
          <div className="md:hidden mb-8 border border-white/10 rounded-2xl bg-[#0d1326] overflow-hidden">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="w-full flex items-center justify-between p-4 bg-[#131b2f]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <ShoppingCart size={18} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resumen del pedido</p>
                  <p className="text-sm font-black text-white">S/ {cartTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  {showSummary ? 'Ocultar' : 'Ver detalle'}
                </span>
                {showSummary ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-primary" />}
              </div>
            </button>

            {showSummary && (
              <div className="p-4 space-y-4 border-t border-white/5 bg-[#0d1326]/50 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.panelId} className="flex justify-between items-start pb-3 border-b border-white/5 last:border-0">
                      <div className="pr-4 min-w-0">
                        <p className="font-bold text-[11px] text-white uppercase tracking-tight truncate">{item.panelCode}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.address}</p>
                      </div>
                      <p className="font-bold text-[11px] text-white whitespace-nowrap">
                        S/ {item.totalPrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>Subtotal (Neto)</span>
                    <span>S/ {(cartTotal / 1.18).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>IGV (18%)</span>
                    <span>S/ {(cartTotal - (cartTotal / 1.18)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white font-black uppercase tracking-widest pt-2 border-t border-white/5">
                    <span>Total</span>
                    <span className="text-primary">S/ {cartTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>


          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#131b2f] border border-slate-800/60 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#131b2f] border border-slate-800/60 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Tipo de Comprobante (Toggle) */}
            <div className="grid grid-cols-2 gap-3 pt-2 pb-2">
              <button
                type="button"
                onClick={() => setReceiptType('boleta')}
                className={`py-3 rounded-lg text-sm font-bold tracking-wider uppercase transition-all border ${receiptType === 'boleta'
                    ? 'border-primary text-primary bg-transparent shadow-[0_0_15px_hsl(var(--primary)/0.1)]'
                    : 'bg-[#131b2f] text-slate-400 border-slate-800/60 hover:bg-slate-800/40'
                  }`}
              >
                Boleta
              </button>
              <button
                type="button"
                onClick={() => setReceiptType('factura')}
                className={`py-3 rounded-lg text-sm font-bold tracking-wider uppercase transition-all border ${receiptType === 'factura'
                    ? 'border-primary text-primary bg-transparent shadow-[0_0_15px_hsl(var(--primary)/0.1)]'
                    : 'bg-[#131b2f] text-slate-400 border-slate-800/60 hover:bg-slate-800/40'
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
                  className="w-full bg-[#131b2f] border border-slate-800/60 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
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
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-[#131b2f] border border-slate-800/60 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#131b2f] border border-slate-800/60 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1.5 flex justify-between">
                <span>Teléfono <span className="text-primary">*</span></span>
              </label>
              <PhoneInput
                defaultCountry="pe"
                value={phone}
                onChange={(phone, { country }) => {
                  const format = country.format;
                  const mask = (typeof format === 'string' ? format : format?.default || '') as string;

                  const countryLimits: Record<string, number> = {
                    pe: 9, ar: 10, bo: 8, br: 11, cl: 9, co: 10, cr: 8, cu: 8, do: 10, ec: 9,
                    sv: 8, gt: 8, hn: 8, mx: 10, ni: 8, pa: 8, py: 9, uy: 9, ve: 10,
                    us: 10, ca: 10, es: 9, pr: 10, bz: 7
                  };

                  const maxDigits = countryLimits[country.iso2] || (mask.split('.').length - 1) || 15;

                  const dialCode = country.dialCode;
                  const dialCodeWithPlus = `+${dialCode}`;
                  const rawNumber = phone.startsWith(dialCodeWithPlus)
                    ? phone.slice(dialCodeWithPlus.length).replace(/\D/g, '')
                    : phone.replace(/\D/g, '');

                  if (rawNumber.length <= maxDigits) {
                    setPhone(phone);
                  }
                }}
                countries={defaultCountries.filter((c) =>
                  ['pe', 'ar', 'bo', 'br', 'cl', 'co', 'cr', 'cu', 'do', 'ec',
                    'sv', 'gt', 'hn', 'mx', 'ni', 'pa', 'py', 'uy', 've',
                    'us', 'ca', 'es', 'pr', 'bz'].includes(c[1])
                )}
                preferredCountries={['pe', 'mx', 'es', 'us']}
                forceDialCode={true}
                charAfterDialCode=""
                inputClassName="react-international-phone-input"
                inputProps={{
                  placeholder: '999999999',
                  required: true,
                }}
                countrySelectorStyleProps={{
                  buttonClassName: 'react-international-phone-country-selector-button',
                  dropdownStyleProps: {
                    className: 'react-international-phone-country-selector-dropdown',
                  },
                }}
              />
            </div>
          </form>
        </div>

        {/* SECCIÓN DERECHA: RESUMEN Y PAGO (Desktop) */}
        <div className="hidden md:flex md:w-[400px] lg:w-[480px] bg-[#0d1326] border-l border-slate-800/50 p-8 flex-col shrink-0">
          <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
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
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">{item.days} días</span>
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
            <div className="space-y-3 mb-6 pb-6 border-b border-slate-800/50">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Subtotal (Neto)</span>
                <span>S/ {(cartTotal / 1.18).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>IGV (18%)</span>
                <span>S/ {(cartTotal - (cartTotal / 1.18)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-4">
              <div className="flex items-center justify-between w-full">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total a pagar</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-primary tracking-tighter">
                    S/ {Number(cartTotal.toFixed(2).split('.')[0]).toLocaleString()}
                  </span>
                  <span className="text-lg font-black text-primary opacity-70">
                    .{cartTotal.toFixed(2).split('.')[1]}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={loading || cartItems.length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-black text-base uppercase tracking-widest transition-all shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4)] active:scale-[0.98] flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0f1c]/95 backdrop-blur-2xl border-t border-white/10 px-5 py-4 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.7)] pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Total:</span>
              <div className="flex items-baseline gap-0.5 text-xl font-black text-primary tracking-tighter">
                <span className="text-sm mr-0.5">S/</span>
                <span>{Number(cartTotal.toFixed(2).split('.')[0]).toLocaleString()}</span>
                <span className="text-xs opacity-80">.{cartTotal.toFixed(2).split('.')[1]}</span>
              </div>
            </div>


            <button
              type="submit"
              form="checkout-form"
              disabled={loading || cartItems.length === 0}
              className="flex-1 max-w-[200px] h-12 bg-primary text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-xl shadow-[0_8px_20px_-5px_hsl(var(--primary)/0.4)] active:scale-[0.96] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <span>Pagar</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ===== MODAL DE PAGO ===== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowPaymentModal(false)} />

          {/* Modal */}
          <div className="relative w-full sm:max-w-md bg-[#0d1326] sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-[0_40px_80px_-10px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom duration-300">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Paso final</p>
                <h2 className="text-lg font-black text-white">Elige tu método de pago</h2>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Total */}
            <div className="mx-6 mt-4 mb-4 bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3 flex items-center justify-between">
              <p className="text-xs text-primary font-bold uppercase tracking-widest">Total a pagar</p>
              <p className="text-2xl font-black text-primary">
                S/ {cartTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 mb-4">
              <button
                onClick={() => setPaymentTab('card')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  paymentTab === 'card' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <CreditCard size={14} /> Tarjeta
              </button>
              <button
                onClick={() => setPaymentTab('qr')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  paymentTab === 'qr' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <QrCode size={14} /> QR / Yape
              </button>
            </div>

            {/* Tab Content */}
            <div className="px-6 pb-6">
              {paymentTab === 'card' ? (
                <div className="space-y-3">
                  {/* Mock card visual */}
                  <div className="relative h-[120px] rounded-2xl bg-gradient-to-br from-[#1a3a6e] to-[#0d1f3c] border border-white/10 p-4 overflow-hidden mb-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-8 translate-x-8" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full translate-y-8 -translate-x-8" />
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Culqi · Pago Seguro</p>
                    <p className="text-white font-mono text-lg tracking-[0.2em]">•••• •••• •••• ••••</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-white/50 text-[10px]">NOMBRE DEL TITULAR</p>
                      <p className="text-white/50 text-[10px]">MM/AA</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Número de tarjeta</label>
                    <input readOnly placeholder="4111 1111 1111 1111" className="w-full bg-[#131b2f] border border-slate-700/60 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Vencimiento</label>
                      <input readOnly placeholder="MM/AA" className="w-full bg-[#131b2f] border border-slate-700/60 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary transition-all" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">CVV</label>
                      <input readOnly placeholder="•••" className="w-full bg-[#131b2f] border border-slate-700/60 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary transition-all" />
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Lock size={10} /> Cifrado SSL · Procesado por Culqi
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  {/* QR SVG placeholder */}
                  <div className="w-44 h-44 bg-white rounded-2xl p-3 mb-4">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {/* Simple QR pattern mockup */}
                      {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
                        const inFinder = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2)
                        return <rect key={`${r}-${c}`} x={r*27+5} y={c*27+5} width={22} height={22} fill={inFinder ? '#1a3a6e' : (Math.random() > 0.5 ? '#0d1326' : 'transparent')} rx={2} />
                      }))}
                      <rect x={5} y={5} width={74} height={74} fill="none" stroke="#0d1326" strokeWidth={6} rx={4} />
                      <rect x={121} y={5} width={74} height={74} fill="none" stroke="#0d1326" strokeWidth={6} rx={4} />
                      <rect x={5} y={121} width={74} height={74} fill="none" stroke="#0d1326" strokeWidth={6} rx={4} />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-white mb-1">Escanea con Yape o Plin</p>
                  <p className="text-[10px] text-slate-400 text-center">Apunta la cámara al QR y completa el pago de <span className="text-primary font-bold">S/ {cartTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></p>
                  <div className="mt-4 bg-[#131b2f] border border-white/5 rounded-xl px-4 py-2 text-center">
                    <p className="text-[10px] text-slate-500">Número de cuenta demo</p>
                    <p className="text-sm font-mono font-bold text-white">9 999 999 999</p>
                  </div>
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleConfirmPayment}
                disabled={paymentLoading}
                className="w-full mt-5 bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4)] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {paymentLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Procesando...</>
                ) : (
                  <><CheckCircle2 size={18} /> Confirmar pago · S/ {cartTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
