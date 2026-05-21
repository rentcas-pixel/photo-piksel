'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { BRAND_SCREEN_SLIDES } from '@/lib/brand-screens'

const LOGO = { src: '/Piksel-logo-juodas-2026.png', width: 982, height: 290 }

export type CampaignCoverViewProps = {
  campaignName: string
  photoCount: number
  /** YYYY-MM-DD */
  uploadedAt: string
  galleryHref: string
}

function PikselLogo() {
  return (
    <div className="w-full bg-white flex justify-center items-center py-10 px-6 shrink-0">
      <img
        src={LOGO.src}
        alt="Piksel"
        width={LOGO.width}
        height={LOGO.height}
        className="block h-9 w-auto max-w-[182px] object-contain"
      />
    </div>
  )
}

function ScreenCarousel({
  slide,
  setSlide,
}: {
  slide: number
  setSlide: (i: number) => void
}) {
  const current = BRAND_SCREEN_SLIDES[slide]

  return (
    <>
      <Image src={current.image} alt={current.name} fill className="object-cover" priority />
      <div className="absolute bottom-14 left-8 right-8 pointer-events-none">
        <p className="text-white text-lg font-medium tracking-tight drop-shadow-md">{current.name}</p>
      </div>
      {BRAND_SCREEN_SLIDES.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {BRAND_SCREEN_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ekranas ${i + 1}`}
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === slide ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </>
  )
}

export function CampaignCoverView({
  campaignName,
  photoCount,
  uploadedAt,
  galleryHref,
}: CampaignCoverViewProps) {
  const [slide, setSlide] = useState(0)
  const photoLabel = photoCount === 1 ? 'nuotrauka' : 'nuotraukos'

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <div className="relative flex-1 min-h-[50vh] lg:min-h-screen bg-gray-900">
        <ScreenCarousel slide={slide} setSlide={setSlide} />
      </div>

      <aside className="w-full lg:w-[min(100%,380px)] lg:shrink-0 flex flex-col min-h-[40vh] lg:min-h-screen bg-white border-l border-gray-100">
        <PikselLogo />
        <div className="flex-1" />
        <div className="px-8 pb-10 pt-6 space-y-6">
          <div className="space-y-1">
            <p className="text-[15px] font-semibold text-gray-900 leading-snug">{campaignName}</p>
            <p className="text-sm text-gray-600">
              {photoCount} {photoLabel}
            </p>
            <p className="text-sm text-gray-500">{uploadedAt}</p>
          </div>

          <Link
            href={galleryHref}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <span>Peržiūrėti nuotraukas</span>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-90" />
          </Link>
        </div>
      </aside>
    </div>
  )
}
