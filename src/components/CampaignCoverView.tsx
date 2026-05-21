'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { BRAND_SCREEN_SLIDES } from '@/lib/brand-screens'

const LOGO = { src: '/Piksel-logo-juodas-2026.png', width: 982, height: 290 }
const SLIDE_INTERVAL_MS = 7000

export type CampaignCoverViewProps = {
  campaignName: string
  photoCount: number
  /** YYYY-MM-DD */
  uploadedAt: string
  galleryHref: string
}

function PikselLogo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src={LOGO.src}
      alt="Piksel"
      width={LOGO.width}
      height={LOGO.height}
      className={`block w-auto object-contain ${compact ? 'h-7 max-w-[140px]' : 'h-8 max-w-[160px]'}`}
    />
  )
}

export function CampaignCoverView({
  campaignName,
  photoCount,
  uploadedAt,
  galleryHref,
}: CampaignCoverViewProps) {
  const [slide, setSlide] = useState(0)
  const current = BRAND_SCREEN_SLIDES[slide]
  const photoLabel = photoCount === 1 ? 'nuotrauka' : 'nuotraukos'

  const goToSlide = useCallback((index: number) => {
    setSlide(index % BRAND_SCREEN_SLIDES.length)
  }, [])

  const nextSlide = useCallback(() => {
    setSlide((i) => (i + 1) % BRAND_SCREEN_SLIDES.length)
  }, [])

  useEffect(() => {
    if (BRAND_SCREEN_SLIDES.length <= 1) return
    const id = window.setInterval(nextSlide, SLIDE_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [nextSlide])

  return (
    <div className="relative min-h-screen bg-gray-900">
      <Image src={current.image} alt={current.name} fill className="object-cover" priority />

      {/* Ekrano pavadinimas — kairėje apačioje */}
      <div className="absolute bottom-10 left-6 sm:left-10 z-10 pointer-events-none max-w-[40%]">
        <p className="text-white text-base sm:text-lg font-medium tracking-tight drop-shadow-md">
          {current.name}
        </p>
      </div>

      {/* Karuselės taškai */}
      {BRAND_SCREEN_SLIDES.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {BRAND_SCREEN_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ekranas ${i + 1}`}
              onClick={() => goToSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === slide ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {/* Balta kortelė — dešinėje, vertikaliai centre */}
      <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-[calc(100%-2rem)] sm:w-full max-w-[360px]">
        <div className="bg-white rounded-xl border border-gray-200/80 p-[1.8rem] sm:p-[2.1rem] space-y-6 shadow-sm">
          <PikselLogo compact />

          <div className="space-y-1">
            <p className="text-[15px] font-semibold text-gray-900 leading-snug">{campaignName}</p>
            <p className="text-sm text-gray-600">
              {photoCount} {photoLabel}
            </p>
            <p className="text-sm text-gray-500">{uploadedAt}</p>
          </div>

          <Link
            href={galleryHref}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span>Peržiūrėti nuotraukas</span>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-90" />
          </Link>
        </div>
      </div>
    </div>
  )
}
