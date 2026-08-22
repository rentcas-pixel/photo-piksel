import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/require-admin-api'
import { allocateUniqueShareCode } from '@/lib/share-code'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await context.params
    if (!campaignId) {
      return NextResponse.json({ error: 'Trūksta ID' }, { status: 400 })
    }

    const auth = await requireAdminApi(request)
    if (!auth.ok) return auth.response

    const { data: existing, error: fetchError } = await auth.admin
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
      const code = await allocateUniqueShareCode(auth.admin)
      const { data: updated, error: updateError } = await auth.admin
        .from('campaigns')
        .update({ share_code: code })
        .eq('id', campaignId)
        .is('share_code', null)
        .select('share_code')
        .maybeSingle()

      if (!updateError && updated?.share_code) {
        return NextResponse.json({ share_code: updated.share_code })
      }

      const { data: refill } = await auth.admin
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
