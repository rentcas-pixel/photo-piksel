import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

const CONTEXTS = new Set(['agency_home', 'client', 'campaign'])

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Serverio konfigūracija: trūksta SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const agencySlug =
      typeof body.agencySlug === 'string' ? body.agencySlug.trim() : ''
    const context = typeof body.context === 'string' ? body.context : ''

    if (!agencySlug || agencySlug.length > 200) {
      return NextResponse.json({ error: 'Netinkamas agentūros identifikatorius' }, { status: 400 })
    }

    if (!CONTEXTS.has(context)) {
      return NextResponse.json({ error: 'Netinkamas kontekstas' }, { status: 400 })
    }

    if (message.length < 3 || message.length > 4000) {
      return NextResponse.json(
        { error: 'Žinutė turi būti nuo 3 iki 4000 simbolių' },
        { status: 400 }
      )
    }

    const row = {
      message,
      agency_slug: agencySlug,
      context,
      client_id: typeof body.clientId === 'string' ? body.clientId : null,
      client_name:
        typeof body.clientName === 'string' ? body.clientName.trim().slice(0, 500) : null,
      campaign_id: typeof body.campaignId === 'string' ? body.campaignId : null,
      campaign_name:
        typeof body.campaignName === 'string'
          ? body.campaignName.trim().slice(0, 500)
          : null,
    }

    const { error } = await supabaseAdmin.from('feature_suggestions').insert(row)

    if (error) {
      console.error('feature_suggestions insert:', error)
      return NextResponse.json(
        { error: 'Nepavyko išsaugoti pasiūlymo. Patikrinkite duomenų bazę.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/suggestions', e)
    return NextResponse.json({ error: 'Serverio klaida' }, { status: 500 })
  }
}
