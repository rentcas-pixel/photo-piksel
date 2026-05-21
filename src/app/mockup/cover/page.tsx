'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

const LOGO = { src: '/Piksel-logo-juodas-2026.png', width: 982, height: 290 }

const SCREEN_SLIDES = [
  { name: 'Justiniskės', image: '/ekranas-justiniskes.jpg' },
  { name: 'Laisvės kelias', image: '/ekranas-laisves-kelias.jpg' },
  { name: 'Narbuto žiedas', image: '/ekranas-narbuto-ziedas.jpg' },
]

const CAMPAIGN = {
  name: 'IKEA — Šaltibarščiai 2025',
  photoCount: 24,
  uploadedAt: '2026-05-18',
}

function PikselLogo({ centered = false, onDark = false }: { centered?: boolean; onDark?: boolean }) {
  const img = (
    <img
      src={LOGO.src}
      alt="Piksel"
      width={LOGO.width}
      height={LOGO.height}
      className={`block w-auto object-contain ${onDark ? 'h-8 max-w-[160px]' : 'h-9 max-w-[182px]'}`}
    />
  )

  if (centered) {
    return (
      <div className="w-full bg-white flex justify-center items-center py-10 px-6">
        {img}
      </div>
    )
  }

  return <div className="w-fit shrink-0">{img}</div>
}

function CampaignBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[15px] font-semibold text-gray-900 leading-snug">{CAMPAIGN.name}</p>
      <p className="text-sm text-gray-600">
        {CAMPAIGN.photoCount} {CAMPAIGN.photoCount === 1 ? 'nuotrauka' : 'nuotraukos'}
      </p>
      <p className="text-sm text-gray-500">{CAMPAIGN.uploadedAt}</p>
    </div>
  )
}

function OpenGalleryButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-5 py-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm ${className}`}
    >
      <span>Peržiūrėti nuotraukas</span>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-90" />
    </button>
  )
}

function ScreenCarousel({
  slide,
  setSlide,
  showName = true,
}: {
  slide: number
  setSlide: (i: number) => void
  showName?: boolean
}) {
  const current = SCREEN_SLIDES[slide]

  return (
    <>
      <Image src={current.image} alt={current.name} fill className="object-cover" priority />

      {showName && (
        <div className="absolute bottom-14 left-8 right-8 pointer-events-none">
          <p className="text-white text-lg font-medium tracking-tight drop-shadow-md">{current.name}</p>
        </div>
      )}

      {SCREEN_SLIDES.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {SCREEN_SLIDES.map((_, i) => (
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

/** Variantas 1: siaura dešinė juosta */
function CoverVariantSidebar({ onOpenGallery }: { onOpenGallery: () => void }) {
  const [slide, setSlide] = useState(0)

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <div className="relative flex-1 min-h-[50vh] lg:min-h-screen bg-gray-900">
        <ScreenCarousel slide={slide} setSlide={setSlide} />
      </div>

      <aside className="w-full lg:w-[min(100%,380px)] lg:shrink-0 flex flex-col min-h-[40vh] lg:min-h-screen bg-white border-l border-gray-100">
        <PikselLogo centered />
        <div className="flex-1" />
        <div className="px-8 pb-10 pt-6 space-y-6">
          <CampaignBlock />
          <OpenGalleryButton onClick={onOpenGallery} />
        </div>
      </aside>
    </div>
  )
}

/** Variantas 2: pilnas ekranas + kortelė dešinėje apačioje */
function CoverVariantOverlay({ onOpenGallery }: { onOpenGallery: () => void }) {
  const [slide, setSlide] = useState(0)

  return (
    <div className="relative min-h-screen bg-gray-900">
      <ScreenCarousel slide={slide} setSlide={setSlide} showName={false} />

      <div className="absolute top-6 left-6 z-10 bg-white px-5 py-4 rounded-sm">
        <PikselLogo />
      </div>

      <div className="absolute bottom-6 right-6 z-10 w-full max-w-[340px] bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <p className="text-xs text-gray-400">Mano kampanija</p>
        <p className="text-lg font-semibold text-gray-900 leading-snug">{CAMPAIGN.name}</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">
            {CAMPAIGN.photoCount} nuotraukos
          </span>
          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">
            {CAMPAIGN.uploadedAt}
          </span>
        </div>
        <OpenGalleryButton onClick={onOpenGallery} />
      </div>
    </div>
  )
}

function GalleryPreview() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="shrink-0 bg-white border-b border-gray-200">
        <PikselLogo centered />
      </header>
      <div className="max-w-7xl mx-auto w-full px-8 py-8 flex-1">
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
          Po cover — esama proof galerija.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden aspect-[3/2] relative"
            >
              <Image src="/ekranas-justiniskes.jpg" alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CoverMockupPage() {
  const [view, setView] = useState<'cover' | 'gallery'>('cover')
  const [variant, setVariant] = useState<'sidebar' | 'overlay'>('sidebar')

  const cover =
    variant === 'sidebar' ? (
      <CoverVariantSidebar onOpenGallery={() => setView('gallery')} />
    ) : (
      <CoverVariantOverlay onOpenGallery={() => setView('gallery')} />
    )

  return (
    <>
      {view === 'cover' ? cover : <GalleryPreview />}

      <div className="fixed top-4 right-4 z-50 flex flex-wrap justify-end gap-1.5 max-w-[90vw] bg-white/95 border border-gray-200 rounded-lg px-1.5 py-1.5 text-sm">
        <button
          type="button"
          onClick={() => {
            setView('cover')
            setVariant('sidebar')
          }}
          className={`px-3 py-1 rounded-md font-medium ${
            view === 'cover' && variant === 'sidebar'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          1. Juosta
        </button>
        <button
          type="button"
          onClick={() => {
            setView('cover')
            setVariant('overlay')
          }}
          className={`px-3 py-1 rounded-md font-medium ${
            view === 'cover' && variant === 'overlay'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          2. Kortelė
        </button>
        <button
          type="button"
          onClick={() => setView('gallery')}
          className={`px-3 py-1 rounded-md font-medium ${
            view === 'gallery' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Galerija
        </button>
      </div>
    </>
  )
}
