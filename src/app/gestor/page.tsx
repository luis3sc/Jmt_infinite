export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, Clock, CheckCircle2, XCircle, AlertCircle, UploadCloud, Send, Award } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'
import { GestorReviewList } from '@/components/gestor/GestorReviewList'
import { Order } from '@/components/gestor/GestorOrderDetail'
import { BackButton } from '@/components/ui/BackButton'
import { Container } from '@/components/ui/Container'

export default async function GestorPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check gestor or admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'gestor' && profile.role !== 'admin')) {
    redirect('/unauthorized')
  }

  // Fetch ALL orders (including those without video)
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      video_url,
      total_amount,
      rejection_reason,
      evidence_urls,
      created_at,
      user_id,
      bookings (
        id,
        start_date,
        end_date,
        amount,
        campaign_name,
        panel_id,
        panels (
          id,
          panel_code,
          face,
          media_type,
          format,
          width,
          height,
          resolution_width,
          resolution_height,
          traffic_view,
          slot_duration_seconds,
          structures (
            code,
            address,
            reference,
            district,
            city,
            latitude,
            longitude
          )
        )
      )
    `)
    .in('status', ['PENDING_UPLOAD', 'VIDEO_SENT', 'PENDING_VALIDATION', 'APPROVED', 'SENT_TO_PROVIDER', 'CONFIRMED', 'REJECTED'])
    .order('created_at', { ascending: false })

  // Fetch profiles with contact info for all unique user_ids
  const userIds = [...new Set(orders?.map(o => o.user_id).filter(Boolean) ?? [])]
  const profilesResult = userIds.length > 0
    ? await supabase
      .from('profiles')
      .select('id, full_name, email, company_name, phone, document_type, receipt_type')
      .in('id', userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null; company_name: string | null; phone: string | null; document_type: string | null; receipt_type: string | null }[] }
  const profilesData = profilesResult.data

  const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p]))

  // Attach profile info and flatten Supabase nested arrays
  const ordersWithProfiles: Order[] = (orders ?? []).map(o => {
    const profile = profileMap[o.user_id] || null;

    // Transform bookings to flatten nested arrays from joins
    const transformedBookings = (o.bookings as any[])?.map(b => {
      // Handle the case where panels might be an array or a single object
      const panelArray = b.panels;
      const firstPanel = Array.isArray(panelArray) ? panelArray[0] : panelArray;

      let transformedPanel = null;
      if (firstPanel) {
        // Handle nested structures array
        const structureArray = firstPanel.structures;
        transformedPanel = {
          ...firstPanel,
          structures: Array.isArray(structureArray) ? structureArray[0] : structureArray
        };
      }

      return {
        ...b,
        panels: transformedPanel
      };
    }) ?? [];

    return {
      id: o.id,
      status: o.status,
      video_url: o.video_url,
      total_amount: o.total_amount,
      rejection_reason: o.rejection_reason,
      evidence_urls: o.evidence_urls,
      created_at: o.created_at,
      user_id: o.user_id,
      profile,
      bookings: transformedBookings
    };
  }).filter(order => {
    if (!order.bookings || order.bookings.length === 0) return true
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date())
    const yyyy = parts.find(p => p.type === 'year')?.value
    const mm = parts.find(p => p.type === 'month')?.value
    const dd = parts.find(p => p.type === 'day')?.value
    const todayStr = `${yyyy}-${mm}-${dd}`
    return order.bookings.some(b => b.end_date >= todayStr)
  });

  // Stats
  const pendingUpload = ordersWithProfiles.filter(o => o.status === 'PENDING_UPLOAD').length
  const pendingReview = ordersWithProfiles.filter(o => o.status === 'VIDEO_SENT' || o.status === 'PENDING_VALIDATION').length
  const approved = ordersWithProfiles.filter(o => o.status === 'APPROVED').length
  const sentToProvider = ordersWithProfiles.filter(o => o.status === 'SENT_TO_PROVIDER').length
  const completed = ordersWithProfiles.filter(o => o.status === 'CONFIRMED').length
  const rejected = ordersWithProfiles.filter(o => o.status === 'REJECTED').length

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <TopBar right={<AuthButton initialRole={profile.role} />} />

      <Container maxW="6xl" className="pt-20 md:pt-24 flex-1 flex flex-col">

        {/* Back */}
        <BackButton href="/map" label="Volver" variant="small" className="mb-8" />

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-none">
                Revisión de Videos
              </h1>
              <p className="text-muted-foreground mt-2 text-sm font-medium">
                Evalúa y valida los materiales de campaña enviados por los clientes.
              </p>
            </div>

            {pendingReview > 0 && (
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-500 text-xs font-black uppercase tracking-widest">
                  {pendingReview} {pendingReview === 1 ? 'video pendiente' : 'videos pendientes'}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 shrink-0">
              <UploadCloud size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">{pendingUpload}</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Sin Video</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-600 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">{pendingReview}</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Por Revisar</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">{approved}</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Aprobados</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-600 shrink-0">
              <Send size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">{sentToProvider}</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Enviado Prov.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 shrink-0">
              <Award size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">{completed}</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Completados</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 shrink-0">
              <XCircle size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">{rejected}</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Rechazados</p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="p-12 rounded-2xl bg-red-50 border border-red-200 text-center">
            <AlertCircle size={40} className="text-red-500/40 mx-auto mb-4" />
            <h3 className="font-bold text-red-600 uppercase tracking-tight">Error de Conexión</h3>
            <p className="text-slate-600 mt-2 text-sm">{error.message}</p>
          </div>
        ) : (
          <GestorReviewList initialOrders={ordersWithProfiles} />
        )}
      </Container>
    </main>
  )
}
