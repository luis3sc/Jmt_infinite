import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('Testing authentication flow...')
  
  // Try to sign up a user that we will then delete data for
  const email = `test_${Date.now()}@example.com`
  const password = 'Test1234!'
  
  console.log(`1. Signing up user: ${email}`)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: 'Test User' }
    }
  })
  
  if (signUpError) {
    console.error('Signup failed:', signUpError)
    return
  }
  
  const userId = signUpData.user!.id
  console.log(`User created with ID: ${userId}`)
  
  // Wait a moment for trigger to fire
  await new Promise(r => setTimeout(r, 1000))
  
  // Delete the profile manually (simulating user action)
  console.log('2. Deleting profile manually...')
  const { error: delError } = await supabase.from('profiles').delete().eq('id', userId)
  if (delError) {
    console.error('Delete profile failed:', delError)
  } else {
    console.log('Profile deleted successfully')
  }
  
  // Now simulate the checkout form submit
  console.log('3. Simulating checkout submit with missing profile...')
  
  const profileData = {
    id: userId,
    email: email,
    full_name: 'Juan Perez',
    phone: '+51999999999',
    document_number: '12345678',
    document_type: 'DNI',
    receipt_type: 'boleta',
    updated_at: new Date().toISOString(),
  }

  // Attempt 1: Upsert
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })

  if (profileError) {
    console.error("Upsert error:", profileError.message)
    
    // Attempt 2: Insert
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)

    if (insertError) {
      console.error("Insert error:", insertError.message)
      
      // Attempt 3: Update
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        
      if (updateError) {
        console.error("Update error:", updateError.message)
      } else {
        console.log('Update succeeded')
      }
    } else {
      console.log('Insert succeeded')
    }
  } else {
    console.log('Upsert succeeded')
  }
}

test().catch(console.error)
