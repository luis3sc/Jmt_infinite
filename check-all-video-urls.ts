import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAll() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, video_url')
    .not('video_url', 'is', null)

  if (error) {
    console.error(error)
    return
  }

  console.log(`Found ${orders.length} orders with non-null video_url:`)
  for (const o of orders) {
    let status = 'UNKNOWN'
    if (o.video_url) {
      try {
        const res = await fetch(o.video_url, { method: 'HEAD' })
        status = `${res.status}`
      } catch (err: any) {
        status = `ERROR: ${err.message}`
      }
    }
    console.log(`Order: ${o.id.slice(0, 8)} | Status: ${o.status} | HTTP: ${status} | URL: ${o.video_url}`)
  }
}

checkAll()
