'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Campaign, Photo } from '@/types/database'
import { ArrowDownToLine, Image as ImageIcon, DownloadCloud, ChevronRight, X, ChevronLeft } from 'lucide-react'
import JSZip from 'jszip'
import Link from 'next/link'
import { isPhotoNew, markPhotosViewed } from '@/lib/photo-visit-state'
import { useIsEmbedded } from '@/lib/use-is-embedded'

interface PhotoWithCampaign extends Photo {
  campaign: Campaign
}

interface Agency {
  id: string
  name: string
  unique_slug: string
}

export default function CampaignPublicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const clientId = params.clientId as string
  const campaignId = params.campaignId as string
  const embedded = useIsEmbedded()
  
  const [agency, setAgency] = useState<Agency | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [photos, setPhotos] = useState<PhotoWithCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithCampaign | null>(null)
  const [newPhotoIds, setNewPhotoIds] = useState<Set<string>>(new Set())

  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const downloadBusy = useRef(false)
  const swipe = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (slug && clientId && campaignId) {
      fetchData()
      
    }
  }, [slug, clientId, campaignId])

  // Identify new photos after photos are loaded
  useEffect(() => {
    if (photos.length === 0) return

    setNewPhotoIds(new Set(photos.filter(photo => isPhotoNew(clientId, campaignId, photo)).map(photo => photo.id)))
  }, [photos, clientId, campaignId])

  const markPhotoAsViewed = (photoId: string) => {
    markPhotosViewed(clientId, campaignId, [photoId])
    setNewPhotoIds(previous => { const next = new Set(previous); next.delete(photoId); return next })
  }

  const navigateToPrevious = () => {
    if (!selectedPhoto || photos.length === 0) return
    
    // Mark current photo as viewed before navigating
    markPhotoAsViewed(selectedPhoto.id)
    
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
    const nextPhoto = currentIndex > 0 
      ? photos[currentIndex - 1]
      : photos[photos.length - 1]
    
    setSelectedPhoto(nextPhoto)
    // Mark new photo as viewed
    markPhotoAsViewed(nextPhoto.id)
  }

  const navigateToNext = () => {
    if (!selectedPhoto || photos.length === 0) return
    
    // Mark current photo as viewed before navigating
    markPhotoAsViewed(selectedPhoto.id)
    
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
    const nextPhoto = currentIndex < photos.length - 1
      ? photos[currentIndex + 1]
      : photos[0]
    
    setSelectedPhoto(nextPhoto)
    // Mark new photo as viewed
    markPhotoAsViewed(nextPhoto.id)
  }

  // Mark photo as viewed when it's opened in lightbox
  useEffect(() => {
    if (selectedPhoto) {
      markPhotoAsViewed(selectedPhoto.id)
    }
  }, [selectedPhoto])

  // Keyboard navigation for photo modal
  useEffect(() => {
    if (!selectedPhoto) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigateToPrevious()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPhoto, photos])

  const fetchData = async () => {
    try {
      // Fetch agency
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('unique_slug', slug)
        .single()

      if (!agencyData) {
        router.push('/404')
        return
      }

      setAgency(agencyData)

      // Fetch client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('agency_id', agencyData.id)
        .single()

      if (clientError || !clientData) {
        router.push(`/${slug}`)
        return
      }

      setClient(clientData)

      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('client_id', clientId)
        .single()

      if (campaignError || !campaignData) {
        router.push(`/${slug}/${clientId}`)
        return
      }

      setCampaign(campaignData)

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select(`
          *,
          campaign:campaigns(*)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      if (!photosError) {
        setPhotos(photosData || [])
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/404')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (photo: PhotoWithCampaign) => {
    if (downloadBusy.current) return
    downloadBusy.current = true
    setDownloadProgress(0)
    try {
      
      const extension = photo.original_name.split('.').pop() || 'jpg'
      const uploadDate = new Date(photo.created_at).toISOString().split('T')[0]
      const newFilename = `Piksel_${client?.name}_${campaign?.name}_${uploadDate}.${extension}`
      
      const response = await fetch(photo.url)
      if (!response.ok) throw new Error('Nuotrauka nepasiekiama')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = newFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      markPhotoAsViewed(photo.id)
      window.setTimeout(() => window.URL.revokeObjectURL(url), 30000)
    } catch (error) {
      console.error('Error downloading photo:', error)
      alert('Klaida atsisiunčiant nuotrauką')
    } finally { downloadBusy.current = false; setDownloadProgress(null) }
  }

  const handleDownloadAll = async (selection: PhotoWithCampaign[] = photos) => {
    if (!selection.length || downloadBusy.current) return
    downloadBusy.current = true
    setDownloadProgress(0)
    try {
      const zip = new JSZip()
      for (let i = 0; i < selection.length; i++) {
        const photo = selection[i]
        const response = await fetch(photo.url)
        if (!response.ok) throw new Error('Nuotrauka nepasiekiama')
        const extension = photo.original_name.split('.').pop() || 'jpg'
        zip.file(`Piksel_${i + 1}_${photo.id}.${extension}`, await response.blob())
        setDownloadProgress(Math.round((i + 1) / selection.length * 75))
      }
      const blob = await zip.generateAsync({ type: 'blob' }, meta => setDownloadProgress(Math.round(75 + meta.percent / 4)))
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      const date = new Date(selection[0].created_at).toISOString().split('T')[0]
      anchor.download = `Piksel_${client?.name}_${campaign?.name}_${date}.zip`.replace(/[\\/:*?"<>|]/g, '-')
      document.body.appendChild(anchor); anchor.click(); anchor.remove()
      selection.forEach(photo => markPhotoAsViewed(photo.id))
      window.setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch {
      alert('Nepavyko paruošti archyvo. Bandykite dar kartą.')
    } finally { downloadBusy.current = false; setDownloadProgress(null) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!client || !agency || !campaign) {
    return null
  }

  return (
    <div className="proof-public min-h-screen bg-white text-[#191919] flex flex-col">
      {!embedded && (
        <header className="shrink-0 bg-[#f7f7f2] border-b border-black/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <img
                src="/Piksel-logo-juodas-2026.png"
                alt="Piksel"
                className="h-8 w-auto"
              />
              <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-gray-500">Photo Proof</span>
            </div>
          </div>
        </header>
      )}

      <div
        className={`flex-1 flex flex-col max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 min-h-0 ${
          embedded ? 'py-4' : 'py-8'
        }`}
      >
        {/* Breadcrumb */}
        <div data-embedded={embedded} className="proof-breadcrumb flex flex-wrap items-center gap-y-2 text-xs text-gray-500 mb-10 shrink-0">
          <Link href={`/${slug}`} className="hover:text-black">
            {agency.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/${slug}/${clientId}`} className="hover:text-black">
            {client.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900 font-medium">{campaign.name}</span>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-black/10 pb-8">
              <div className="min-w-0 max-w-3xl">
                <p className="mb-4 text-[14px] font-semibold uppercase tracking-[0.2em] text-gray-500">KAMPANIJOS GALERIJA</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-[-0.045em] leading-[1.12] text-[#20231d] break-words">{client.name}</h1><p className="mt-3 text-base text-gray-600">{campaign.name}</p>
                {campaign.description && <p className="mt-4 text-sm leading-relaxed text-gray-500">{campaign.description}</p>}
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-2"><ImageIcon className="h-4 w-4" />Nuotraukos: {photos.length}</span>
                  {photos[0] && <span>Atnaujinta {new Date(photos[0].created_at).toLocaleDateString('lt-LT')}</span>}
                </div>
              </div>
              {photos.length > 0 && (
                <button disabled={downloadProgress !== null} onClick={() => handleDownloadAll()} className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-[#242820] px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-[#424b36] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#242820]">
                  <DownloadCloud className="h-4 w-4" /> Atsisiųsti visas <span className="text-white/50">ZIP · {photos.length}</span>
                </button>
              )}
            </div>

            {downloadProgress !== null && <div className="proof-download-progress" role="status">Ruošiama <progress max={100} value={downloadProgress} aria-label="Atsisiuntimo paruošimas" />{downloadProgress}%</div>}
            {/* Photos Grid */}
            {photos.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
                <div className="text-gray-300 mb-6">
                  <ImageIcon className="mx-auto h-16 w-16" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Nėra nuotraukų</h3>
                <p className="text-gray-500 text-lg">
                  Šiai kampanijai dar nėra įkeltų nuotraukų
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-9">
                {photos.map((photo, index) => (
                  <article key={photo.id} className="group min-w-0">
                    <div className="relative overflow-hidden rounded-xl bg-[#e8e9e2]">
                      <button type="button" onClick={() => { setSelectedPhoto(photo); markPhotoAsViewed(photo.id) }} aria-label={`Peržiūrėti ${photo.original_name}`} className="block w-full aspect-[3/2] overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white">
                        <img src={photo.url} alt={photo.original_name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]" />
                      </button>
                      {newPhotoIds.has(photo.id) && <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#e2efad] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#29301d]">Nauja</span>}
                      <button type="button" disabled={downloadProgress !== null} onClick={() => handleDownload(photo)} className="absolute bottom-[20px] right-[20px] inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/20 bg-black text-white transition-colors hover:bg-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50" aria-label={`Atsisiųsti ${photo.original_name}`}><ArrowDownToLine className="h-[14px] w-[14px]" /></button>
                    </div>
                    <div className="flex items-center gap-3 pt-3.5">
                      <span className="text-[12px] tabular-nums text-gray-400">{String(index + 1).padStart(2, '0')}</span>
                      <p className="text-[14px] text-gray-500">{new Date(photo.created_at).toLocaleDateString('lt-LT')}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="proof-thumbnails" onClick={e => e.stopPropagation()}>{photos.map(photo => <button key={photo.id} aria-label={`Rodyti ${photo.original_name}`} aria-pressed={selectedPhoto.id === photo.id} onClick={() => setSelectedPhoto(photo)}><img src={photo.url} alt="" /></button>)}</div>
          <div className="relative max-w-7xl max-h-full w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Navigation buttons (šalia „dėžės“, ne ant pačios nuotraukos krašto) */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateToPrevious()
                  }}
                  className="absolute left-0 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10 shadow-lg"
                  title="Ankstesnė nuotrauka (←)"
                >
                  <ChevronLeft className="h-5 w-5 text-white stroke-2" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateToNext()
                  }}
                  className="absolute right-0 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors z-10 shadow-lg"
                  title="Kita nuotrauka (→)"
                >
                  <ChevronRight className="h-5 w-5 text-white stroke-2" />
                </button>
              </>
            )}

            {/* Juoda valdymo juosta virš nuotraukos neuždengia jos turinio. */}
            <div className="relative inline-block max-w-full overflow-hidden rounded-lg bg-black">
              <div className="grid grid-cols-[minmax(96px,1fr)_minmax(0,96px)_minmax(96px,1fr)] items-center bg-black p-5 text-white" role="toolbar" aria-label="Nuotraukos valdymas">
                <span className="justify-self-start rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium tabular-nums" aria-live="polite">
                  {photos.findIndex((p) => p.id === selectedPhoto.id) + 1} / {photos.length}
                </span>
                <img src="/Piksel-logo-baltas-2026.png" alt="Piksel" className="block h-auto w-full max-w-24 justify-self-center" />
                <div className="flex gap-2 justify-self-end">
                  <button
                    type="button"
                    disabled={downloadProgress !== null}
                    onClick={() => handleDownload(selectedPhoto)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/20 bg-black text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                    aria-label="Atsisiųsti nuotrauką"
                    title="Atsisiųsti nuotrauką"
                  >
                    <ArrowDownToLine className="h-[14px] w-[14px] stroke-2" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(null)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/20 bg-black text-white transition-colors hover:bg-white/10"
                    aria-label="Uždaryti"
                    title="Uždaryti (ESC)"
                  >
                    <X className="h-5 w-5 stroke-2" />
                  </button>
                </div>
              </div>
              <img
                onTouchStart={e => { swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
                onTouchEnd={e => { if (!swipe.current) return; const dx = e.changedTouches[0].clientX - swipe.current.x; const dy = e.changedTouches[0].clientY - swipe.current.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) navigateToNext(); else navigateToPrevious() } swipe.current = null }}
                src={selectedPhoto.url}
                alt={selectedPhoto.original_name}
                className="block max-h-[max(100px,calc(100svh-264px))] max-w-full w-auto h-auto object-contain rounded-b-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

