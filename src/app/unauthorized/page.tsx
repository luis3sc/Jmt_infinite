import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-8">
          No tienes los permisos necesarios para acceder a esta página.
        </p>
        <Link 
          href="/" 
          className="inline-flex justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}
