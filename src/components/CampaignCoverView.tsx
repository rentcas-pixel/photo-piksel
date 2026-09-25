'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { BRAND_SCREEN_SLIDES } from '@/lib/brand-screens'

const LOGO = { src: '/Piksel-logo-juodas-2026.png', width: 982, height: 290 }
const SLIDE_INTERVAL_MS = 7000

export type CoverAction = {
  label: string
  href?: string
  onClick?: () => void
}

export type CampaignCoverViewProps = {
  title: string
  subtitleLines: string[]
  action: CoverAction
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

function CoverActionButton({ action }: { action: CoverAction }) {
  const className =
    'w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#242820] text-white text-sm font-medium rounded-full hover:bg-[#424b36] transition-colors'

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        <span>{action.label}</span>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-90" />
      </Link>
    )
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      <span>{action.label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-90" />
    </button>
  )
}

/** Kampanijos cover — suderinamumas su senais props. */
export function CampaignCoverViewFromCampaign(opts: {
  campaignName: string
  photoCount: number
  uploadedAt: string
  galleryHref: string
}) {
  const photoLabel = opts.photoCount === 1 ? 'nuotrauka' : 'nuotraukos'
  return (
    <CampaignCoverView
      title={opts.campaignName}
      subtitleLines={[`${opts.photoCount} ${photoLabel}`, opts.uploadedAt]}
      action={{ label: 'Peržiūrėti nuotraukas', href: opts.galleryHref }}
    />
  )
}

export function CampaignCoverView({ title, subtitleLines, action }: CampaignCoverViewProps) {
  const [slide, setSlide] = useState(0)
  const current = BRAND_SCREEN_SLIDES[slide]

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
    <div className="relative min-h-[100svh] bg-gray-900 overflow-hidden">
      <Image src={current.image} alt={current.name} fill className="object-cover" priority />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/15" />

      <div className="absolute bottom-10 left-6 sm:left-10 z-10 pointer-events-none max-w-[40%]">
        <p className="text-white text-base sm:text-lg font-medium tracking-tight drop-shadow-md">
          {current.name}
        </p>
      </div>

      {BRAND_SCREEN_SLIDES.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {BRAND_SCREEN_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={BRAND_SCREEN_SLIDES[i].name}
              aria-pressed={i === slide}
              onClick={() => goToSlide(i)}
              className={`h-3 rounded-full transition-all ${
                i === slide ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      <div className="relative ml-auto flex min-h-[100svh] items-center px-5 py-28 sm:px-12 lg:px-20 z-10 w-full sm:max-w-[560px]">
        <div className="w-full bg-[#fafaf5] rounded-2xl p-8 sm:p-11 space-y-9 shadow-2xl">
          <div className="flex items-center justify-between gap-4"><PikselLogo compact /><span className="text-[9px] uppercase tracking-[0.2em] text-gray-500">Photo Proof</span></div>

          <div className="space-y-3">
            <p className="text-3xl sm:text-4xl font-medium tracking-[-0.04em] text-[#242820] leading-[1.12] break-words">{title}</p>
            {subtitleLines.map((line, i) => (
              <p key={i} className="text-xs text-gray-500">
                {line}
              </p>
            ))}
          </div>

          <CoverActionButton action={action} />
        </div>
      </div>
    </div>
  )
}
