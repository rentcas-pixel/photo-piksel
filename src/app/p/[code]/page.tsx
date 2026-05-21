import { notFound } from 'next/navigation'
import { CampaignCoverView } from '@/components/CampaignCoverView'
import { formatUploadedDate } from '@/lib/resolve-share-code'
import {
  getCampaignPhotoStatsServer,
  resolveShareCodeServer,
} from '@/lib/resolve-share-code-server'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ code: string }>
}

export default async function ShareLinkCoverPage({ params }: PageProps) {
  const { code } = await params
  const campaign = await resolveShareCodeServer(code)

  if (!campaign) {
    notFound()
  }

  const stats = await getCampaignPhotoStatsServer(campaign.campaignId)
  const galleryHref = `/${campaign.slug}/${campaign.clientId}/${campaign.campaignId}`

  return (
    <CampaignCoverView
      campaignName={campaign.name}
      photoCount={stats.count}
      uploadedAt={formatUploadedDate(stats.latestUploadedAt, campaign.updatedAt)}
      galleryHref={galleryHref}
    />
  )
}
