'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Left Side: Form */}
      <div className="flex-1 lg:flex-none lg:w-1/3 flex flex-col justify-center py-12 px-6 lg:px-20 xl:px-24 relative z-10 bg-background">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <Link href="/" className="inline-block mb-10 transition-transform hover:scale-105 active:scale-95">
              <div className="relative w-40 h-10">
                <Image
                  src="/assets/images/jmtinfinite_logo.svg"
                  alt="JMT Infinite"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>

            <h2 className="text-3xl font-black tracking-tight text-foreground">Inicia sesión</h2>
            <p className="mt-3 text-sm text-muted-foreground font-medium">
              ¿No tienes una cuenta?{' '}
              <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-bold underline underline-offset-4 decoration-primary/30 hover:decoration-primary">
                Regístrate gratis
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" action={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="tu@ejemplo.com"
                  className="block w-full appearance-none rounded-2xl border border-border bg-card/50 px-4 py-3.5 text-foreground placeholder-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm font-medium transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label htmlFor="password" className="block text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                    Contraseña
                  </label>
                  <Link href="/forgot-password" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="block w-full appearance-none rounded-2xl border border-border bg-card/50 px-4 py-3.5 text-foreground placeholder-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm font-medium transition-all"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-2xl bg-primary px-4 py-4 text-sm font-black text-white shadow-[0_10px_20px_-5px_rgba(98,174,64,0.3)] hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-all active:scale-[0.98] uppercase tracking-widest"
              >
                {loading ? 'Iniciando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>

        {/* Decorative elements for the form side */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[10%] w-32 h-32 bg-primary/5 rounded-full blur-[80px]" />
        </div>
      </div>

      {/* Right Side: Image (Desktop only) */}
      <div className="hidden lg:block relative flex-1 overflow-hidden">
        <Image
          src="/assets/images/auth-bg.png"
          alt="JMT Billboard"
          fill
          priority
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Overlay Content */}
        <div className="absolute bottom-12 left-12 right-12 z-20">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] max-w-lg">
            <h3 className="text-3xl font-black text-white leading-tight mb-4">
              La red de paneles más <br />
              <span className="text-primary italic font-serif">grande del país.</span>
            </h3>
            <p className="text-white/70 font-medium text-lg leading-relaxed">
              Únete a las marcas líderes que ya están transformando su presencia digital con JMT.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
