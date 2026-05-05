import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin'
import { allocateUniqueShareCode } from '@/lib/share-code'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
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
        { error: 'Serverio konfigūracijos klaida (Supabase raktai).' },
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
      return NextResponse.json(
        { error: 'Neturite teisės kurti kampanijų.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const client_id = body.client_id as string | undefined
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const descriptionRaw = body.description
    const description =
      typeof descriptionRaw === 'string' && descriptionRaw.trim()
        ? descriptionRaw.trim()
        : null

    if (!client_id || !name) {
      return NextResponse.json(
        { error: 'Trūksta kliento arba kampanijos pavadinimo.' },
        { status: 400 }
      )
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    let share_code: string
    try {
      share_code = await allocateUniqueShareCode(admin)
    } catch {
      return NextResponse.json(
        { error: 'Nepavyko sugeneruoti trumpos nuorodos kodo.' },
        { status: 500 }
      )
    }

    const { data, error } = await admin
      .from('campaigns')
      .insert({
        client_id,
        name,
        description,
        share_code,
      })
      .select('id, share_code')
      .single()

    if (error) {
      console.error('Campaign insert error:', error)
      return NextResponse.json(
        { error: error.message || 'Nepavyko įrašyti į duomenų bazę.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      id: data.id,
      share_code: (data as { share_code?: string }).share_code ?? share_code,
    })
  } catch (e) {
    console.error('POST /api/campaigns:', e)
    return NextResponse.json({ error: 'Serverio klaida.' }, { status: 500 })
  }
}
