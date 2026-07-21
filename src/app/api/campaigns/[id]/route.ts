import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/require-admin-api'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await context.params
    if (!campaignId) {
      return NextResponse.json({ error: 'Trūksta kampanijos ID' }, { status: 400 })
    }

    const auth = await requireAdminApi(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const descriptionRaw = body.description
    const description =
      typeof descriptionRaw === 'string' && descriptionRaw.trim()
        ? descriptionRaw.trim()
        : null

    if (!name) {
      return NextResponse.json(
        { error: 'Įveskite kampanijos pavadinimą' },
        { status: 400 }
      )
    }

    const { data, error } = await auth.admin
      .from('campaigns')
      .update({
        name,
        description,
      })
      .eq('id', campaignId)
      .select('id, name, description')
      .maybeSingle()

    if (error) {
      console.error('Campaign update error:', error)
      return NextResponse.json(
        { error: error.message || 'Nepavyko atnaujinti kampanijos.' },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Kampanija nerasta.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('PATCH /api/campaigns/[id]:', e)
    return NextResponse.json({ error: 'Serverio klaida.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await context.params
    if (!campaignId) {
      return NextResponse.json({ error: 'Trūksta kampanijos ID' }, { status: 400 })
    }

    const auth = await requireAdminApi(request)
    if (!auth.ok) return auth.response

    const { data: photos } = await auth.admin
      .from('photos')
      .select('id, filename')
      .eq('campaign_id', campaignId)

    if (photos && photos.length > 0) {
      const filenames = photos
        .map((p) => p.filename)
        .filter((name): name is string => Boolean(name))

      const { error: photosDeleteError } = await auth.admin
        .from('photos')
        .delete()
        .eq('campaign_id', campaignId)

      if (photosDeleteError) {
        console.error('Campaign photos delete error:', photosDeleteError)
        return NextResponse.json(
          { error: photosDeleteError.message || 'Nepavyko ištrinti nuotraukų.' },
          { status: 400 }
        )
      }

      if (filenames.length > 0) {
        const { error: storageError } = await auth.admin.storage
          .from('photos')
          .remove(filenames)
        if (storageError) {
          console.error('Storage delete warning:', storageError)
        }
      }
    }

    const { data: deleted, error } = await auth.admin
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('Campaign delete error:', error)
      return NextResponse.json(
        { error: error.message || 'Nepavyko ištrinti kampanijos.' },
        { status: 400 }
      )
    }

    if (!deleted) {
      return NextResponse.json({ error: 'Kampanija nerasta.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/campaigns/[id]:', e)
    return NextResponse.json({ error: 'Serverio klaida.' }, { status: 500 })
  }
}
