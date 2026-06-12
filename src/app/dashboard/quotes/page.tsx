import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, AlertCircle } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'
import { QuotesList } from '@/components/dashboard/QuotesList'

export default async function QuotesPage() {
 const supabase = createClient()

 const {
  data: { user },
 } = await supabase.auth.getUser()

 if (!user) {
  redirect('/login')
 }

 const { data: quotes, error } = await supabase
  .from('saved_campaigns')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

 let profile = null
 if (!error && user) {
  const { data: profileData } = await supabase
   .from('profiles')
   .select('email, phone, document_type, document_number')
   .eq('id', user.id)
   .maybeSingle()
  profile = profileData
 }

 return (
  <main className="min-h-screen bg-background text-foreground flex flex-col">
   <TopBar right={<AuthButton />} />

   <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 pt-20 md:pt-24">

    {/* Header */}
    <header className="mb-10 border-b border-border pb-8">
     <div className="flex items-end justify-between gap-6">
      <div>
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Campañas guardadas</p>
       <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none">
        Mis Cotizaciones
       </h1>
      </div>
      {quotes && quotes.length > 0 && (
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:block">
        {quotes.length} {quotes.length === 1 ? 'cotización' : 'cotizaciones'}
       </p>
      )}
     </div>
    </header>

    {error ? (
     <div className="p-10 rounded-lg bg-red-50 border border-red-200 text-center">
      <AlertCircle size={36} className="text-red-500/40 mx-auto mb-3" />
      <h3 className="text-sm font-black text-red-600 uppercase tracking-tight">Error de Conexión</h3>
      <p className="text-slate-500 mt-1 text-xs">{error.message}</p>
     </div>
    ) : !quotes || quotes.length === 0 ? (
     <div className="py-24 rounded-lg bg-card border border-dashed border-border text-center shadow-sm">
      <FileText size={32} className="text-slate-300 mx-auto mb-5" strokeWidth={1} />
      <h2 className="text-lg font-black text-foreground mb-2 uppercase tracking-tight">Sin cotizaciones</h2>
      <p className="text-muted-foreground mb-8 max-w-xs mx-auto text-sm font-medium">
       Tus campañas guardadas y cotizaciones aparecerán aquí una vez que crees la primera en el mapa de pantallas.
      </p>
      <Link
       href="/map"
       className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all "
      >
       Explorar Pantallas
      </Link>
     </div>
    ) : (
     <QuotesList initialQuotes={quotes} userProfile={profile} />
    )}
   </div>
  </main>
 )
}
