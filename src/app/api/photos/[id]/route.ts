import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/require-admin-api'
import { storageObjectKey } from '@/lib/storage-filename'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await context.params
    if (!photoId) {
      return NextResponse.json({ error: 'Trūksta nuotraukos ID' }, { status: 400 })
    }

    const auth = await requireAdminApi(request)
    if (!auth.ok) return auth.response

    const { data: photo, error: fetchError } = await auth.admin
      .from('photos')
      .select('id, filename, url')
      .eq('id', photoId)
      .maybeSingle()

    if (fetchError) {
      console.error('Photo fetch error:', fetchError)
      return NextResponse.json(
        { error: fetchError.message || 'Nepavyko rasti nuotraukos.' },
        { status: 400 }
      )
    }

    if (!photo) {
      return NextResponse.json({ error: 'Nuotrauka nerasta.' }, { status: 404 })
    }

    const { data: deletedRows, error: deleteError } = await auth.admin
      .from('photos')
      .delete()
      .eq('id', photoId)
      .select('id')

    if (deleteError) {
      console.error('Photo delete error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Nepavyko ištrinti nuotraukos.' },
        { status: 400 }
      )
    }

    if (!deletedRows?.length) {
      const { data: stillThere } = await auth.admin
        .from('photos')
        .select('id')
        .eq('id', photoId)
        .maybeSingle()

      if (stillThere) {
        return NextResponse.json(
          { error: 'Nuotrauka neištrinta (nerasta arba nėra teisių).' },
          { status: 404 }
        )
      }
    }

    const objectKey = storageObjectKey(photo.filename, photo.url)
    if (objectKey) {
      const { error: storageError } = await auth.admin.storage
        .from('photos')
        .remove([objectKey])

      if (storageError) {
        console.error('Storage delete warning:', storageError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/photos/[id]:', e)
    return NextResponse.json({ error: 'Serverio klaida.' }, { status: 500 })
  }
}
