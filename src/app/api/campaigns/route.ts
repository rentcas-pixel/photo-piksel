import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/require-admin-api'
import { allocateUniqueShareCode } from '@/lib/share-code'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (!auth.ok) return auth.response

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

    let share_code: string
    try {
      share_code = await allocateUniqueShareCode(auth.admin)
    } catch {
      return NextResponse.json(
        { error: 'Nepavyko sugeneruoti trumpos nuorodos kodo.' },
        { status: 500 }
      )
    }

    const { data, error } = await auth.admin
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
