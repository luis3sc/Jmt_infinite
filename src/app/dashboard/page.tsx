import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import AuthButton from '@/components/layout/AuthButton'
import ProfileClient from '@/components/dashboard/ProfileClient'
import { Container } from '@/components/ui/Container'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profiles table data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle()

  const profileData = {
    fullName: profile?.full_name || user.user_metadata?.full_name || '',
    email: user.email || '',
    phone: profile?.phone || '',
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <TopBar right={<AuthButton />} />

      <Container maxW="6xl" className="pt-20 md:pt-24 flex-1 flex flex-col">

        {/* Profile Details and Actions */}
        <ProfileClient initialProfile={profileData} />
      </Container>
    </main>
  )
}


