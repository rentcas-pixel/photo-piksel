'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CampaignCoverView } from '@/components/CampaignCoverView'
import {
  formatUploadedDate,
  getCampaignPhotoStats,
  resolveShareCode,
} from '@/lib/resolve-share-code'

export default function ShareLinkCoverPage() {
  const params = useParams()
  const router = useRouter()
  const code = (params.code as string) || ''

  const [loading, setLoading] = useState(true)
  const [resolved, setResolved] = useState<{
    slug: string
    clientId: string
    campaignId: string
    name: string
    photoCount: number
    uploadedAt: string
  } | null>(null)

  useEffect(() => {
    if (!code) {
      router.push('/404')
      return
    }

    const load = async () => {
      const campaign = await resolveShareCode(code)
      if (!campaign) {
        router.push('/404')
        return
      }

      const stats = await getCampaignPhotoStats(campaign.campaignId)

      setResolved({
        slug: campaign.slug,
        clientId: campaign.clientId,
        campaignId: campaign.campaignId,
        name: campaign.name,
        photoCount: stats.count,
        uploadedAt: formatUploadedDate(stats.latestUploadedAt, campaign.updatedAt),
      })
      setLoading(false)
    }

    load()
  }, [code, router])

  if (loading || !resolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const galleryHref = `/${resolved.slug}/${resolved.clientId}/${resolved.campaignId}`

  return (
    <CampaignCoverView
      campaignName={resolved.name}
      photoCount={resolved.photoCount}
      uploadedAt={resolved.uploadedAt}
      galleryHref={galleryHref}
    />
  )
}
