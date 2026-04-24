import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-[100dvh] flex-col py-24 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-card px-4 py-8 shadow-sm sm:rounded-2xl sm:px-10 border border-border">
          <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido al dashboard, {user.email}.
          </p>
          <div className="mt-8 p-6 bg-muted rounded-xl">
            <h2 className="text-xl font-semibold mb-2 text-foreground">Mis Pedidos</h2>
            <p className="text-muted-foreground">Aquí aparecerán tus reservas y compras.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
