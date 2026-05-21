'use client'

import { CampaignCoverView } from '@/components/CampaignCoverView'

/** Vietinis peržiūros mockup — tas pats komponentas kaip /p/{code} */
export default function CoverMockupPage() {
  return (
    <CampaignCoverView
      campaignName="IKEA — Šaltibarščiai 2026"
      photoCount={24}
      uploadedAt="2026-05-18"
      galleryHref="/mockup/cover?preview=gallery"
    />
  )
}
