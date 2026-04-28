'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'

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
    <div className="flex min-h-[100dvh] flex-col bg-background relative">
      <TopBar />

      <div className="flex-1 flex flex-col justify-center mt-14 md:mt-16 py-10 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Enhanced Back Button Location - Now on the left side with premium styling */}
          <div className="mb-8 flex justify-start">
            <button 
              onClick={() => router.back()}
              className="w-fit flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card/50 backdrop-blur-sm border border-border shadow-sm hover:bg-muted hover:border-primary/20 transition-all active:scale-95 group text-sm font-semibold"
            >
              <ArrowLeft size={18} className="text-primary group-hover:-translate-x-1 transition-transform" />
              <span className="text-muted-foreground group-hover:text-foreground">Volver</span>
            </button>
          </div>

          <div className="flex flex-col items-center">
            <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Inicia sesión
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              O{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                crea una cuenta nueva
              </Link>
            </p>
          </div>
        </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 sm:shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl sm:px-10 border sm:border-border">
          <form className="space-y-5" action={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full appearance-none rounded-xl border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full appearance-none rounded-xl border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Iniciando...' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  )
}
