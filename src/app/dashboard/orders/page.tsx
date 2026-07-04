import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'
import { OrdersList } from '@/components/dashboard/OrdersList'
import { Container } from '@/components/ui/Container'
import { Alert } from '@/components/ui/Alert'
import { buttonVariants, buttonSizes } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default async function OrdersPage() {
    const supabase = createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
   *,
   profiles (
    full_name,
    company_name,
    document_type,
    document_number,
    phone,
    receipt_type,
    email
   ),
   bookings (
    id,
    start_date,
    end_date,
    amount,
    panels (
     panel_code,
     width,
     height,
     format,
     face,
     structures (
      address,
      district,
      organization_id,
      organizations (
       name
      )
     )
    )
   )
  `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            <TopBar right={<AuthButton />} />

            <Container maxW="6xl" className="pt-20 md:pt-24 flex-1 flex flex-col">

                {/* Header */}
                <header className="mb-10 ">
                    <div className="flex items-end justify-between gap-6">
                        <div>

                            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none">
                                Mis Campañas
                            </h1>
                        </div>
                    </div>
                </header>

                {error ? (
                    <Alert variant="destructive" title="Error de Conexión" className="mb-8">
                        {error.message}
                    </Alert>
                ) : !orders || orders.length === 0 ? (
                    <div className="py-24 rounded-dialog bg-card border border-dashed border-border text-center shadow-sm">
                        <ShoppingBag size={32} className="text-muted-foreground/30 mx-auto mb-5" strokeWidth={1} />
                        <h2 className="text-lg font-black text-foreground mb-2 uppercase tracking-tight">Sin pedidos</h2>
                        <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-sm font-medium">
                            Tus compras de publicidad aparecerán aquí una vez que realices tu primer pedido.
                        </p>
                        <Link
                            href="/map"
                            className={cn(
                                buttonVariants.default,
                                buttonSizes.lg,
                                "inline-flex items-center gap-2 uppercase font-black tracking-wider text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            )}
                        >
                            Explorar Pantallas
                        </Link>
                    </div>
                ) : (
                    <OrdersList initialOrders={orders} />
                )}
            </Container>
        </main>
    )
}
