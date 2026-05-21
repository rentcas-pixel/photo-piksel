'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CampaignCoverView } from '@/components/CampaignCoverView'

function formatUploadedDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}

export default function CampaignCoverPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const clientId = params.clientId as string
  const campaignId = params.campaignId as string

  const [loading, setLoading] = useState(true)
  const [campaignName, setCampaignName] = useState('')
  const [photoCount, setPhotoCount] = useState(0)
  const [uploadedAt, setUploadedAt] = useState('—')

  useEffect(() => {
    if (!slug || !clientId || !campaignId) return

    const fetchData = async () => {
      try {
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('id')
          .eq('unique_slug', slug)
          .single()

        if (!agencyData) {
          router.push('/404')
          return
        }

        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('id', clientId)
          .eq('agency_id', agencyData.id)
          .single()

        if (!clientData) {
          router.push(`/${slug}`)
          return
        }

        const { data: campaignData } = await supabase
          .from('campaigns')
          .select('id, name, updated_at')
          .eq('id', campaignId)
          .eq('client_id', clientId)
          .single()

        if (!campaignData) {
          router.push(`/${slug}/${clientId}`)
          return
        }

        setCampaignName(campaignData.name)

        const { data: photosData } = await supabase
          .from('photos')
          .select('created_at')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })

        const photos = photosData || []
        setPhotoCount(photos.length)

        const latest = photos[0]?.created_at ?? campaignData.updated_at
        setUploadedAt(formatUploadedDate(latest))
      } catch {
        router.push('/404')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, clientId, campaignId, router])

  const galleryHref = `/${slug}/${clientId}/${campaignId}`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <CampaignCoverView
      campaignName={campaignName}
      photoCount={photoCount}
      uploadedAt={uploadedAt}
      galleryHref={galleryHref}
    />
  )
}
