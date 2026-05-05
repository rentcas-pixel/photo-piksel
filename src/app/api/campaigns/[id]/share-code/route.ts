import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin'
import { allocateUniqueShareCode } from '@/lib/share-code'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await context.params
    if (!campaignId) {
      return NextResponse.json({ error: 'Trūksta ID' }, { status: 400 })
    }

    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json(
        { error: 'Nėra sesijos. Prisijunkite iš naujo.' },
        { status: 401 }
      )
    }

    if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
      return NextResponse.json(
        { error: 'Serverio konfigūracijos klaida.' },
        { status: 500 }
      )
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Neturite teisės.' }, { status: 403 })
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: existing, error: fetchError } = await admin
      .from('campaigns')
      .select('share_code')
      .eq('id', campaignId)
      .maybeSingle()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Kampanija nerasta.' }, { status: 404 })
    }

    if (existing.share_code) {
      return NextResponse.json({ share_code: existing.share_code })
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = await allocateUniqueShareCode(admin)
      const { data: updated, error: updateError } = await admin
        .from('campaigns')
        .update({ share_code: code })
        .eq('id', campaignId)
        .is('share_code', null)
        .select('share_code')
        .maybeSingle()

      if (!updateError && updated?.share_code) {
        return NextResponse.json({ share_code: updated.share_code })
      }

      const { data: refill } = await admin
        .from('campaigns')
        .select('share_code')
        .eq('id', campaignId)
        .maybeSingle()
      if (refill?.share_code) {
        return NextResponse.json({ share_code: refill.share_code })
      }

      const msg = updateError?.message || ''
      if (!msg.includes('duplicate') && !msg.includes('unique')) {
        console.error('share-code update:', updateError)
        return NextResponse.json(
          { error: msg || 'Nepavyko išsaugoti kodo.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ error: 'Nepavyko sugeneruoti kodo.' }, { status: 500 })
  } catch (e) {
    console.error('POST share-code:', e)
    return NextResponse.json({ error: 'Serverio klaida.' }, { status: 500 })
  }
}
