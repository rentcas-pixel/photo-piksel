'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Campaign, Photo } from '@/types/database'
import { Download, Image as ImageIcon, DownloadCloud, ChevronRight, X } from 'lucide-react'
import JSZip from 'jszip'
import Link from 'next/link'

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
  
  const [agency, setAgency] = useState<Agency | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [photos, setPhotos] = useState<PhotoWithCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithCampaign | null>(null)

  useEffect(() => {
    if (slug && clientId && campaignId) {
      fetchData()
    }
  }, [slug, clientId, campaignId])

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
    try {
      const extension = photo.original_name.split('.').pop() || 'jpg'
      const uploadDate = new Date(photo.created_at).toISOString().split('T')[0]
      const newFilename = `Piksel_${client?.name}_${campaign?.name}_${uploadDate}.${extension}`
      
      const response = await fetch(photo.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = newFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading photo:', error)
      alert('Klaida atsisiunčiant nuotrauką')
    }
  }

  const handleDownloadAll = async () => {
    if (photos.length === 0) return
    
    try {
      const zip = new JSZip()
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const extension = photo.original_name.split('.').pop() || 'jpg'
        const uploadDate = new Date(photo.created_at).toISOString().split('T')[0]
        const newFilename = `Piksel_${client?.name}_${campaign?.name}_${uploadDate}_${i + 1}.${extension}`
        
        const response = await fetch(photo.url)
        const blob = await response.blob()
        zip.file(newFilename, blob)
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const uploadDate = new Date(photos[0].created_at).toISOString().split('T')[0]
      const zipFilename = `Piksel_${client?.name}_${campaign?.name}_${uploadDate}.zip`
      
      const a = document.createElement('a')
      a.href = url
      a.download = zipFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading all photos:', error)
      alert('Klaida atsisiunčiant nuotraukas')
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <img
              src="/Piksel-logo-black-2023.png"
              alt="Piksel"
              className="h-8 w-auto"
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-6">
          <Link href={`/${slug}`} className="hover:text-indigo-600">
            {agency.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/${slug}/${clientId}`} className="hover:text-indigo-600">
            {client.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900 font-medium">{campaign.name}</span>
        </div>

        {/* Campaign Info & Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-gray-600 mt-1">{campaign.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 px-4 py-2 rounded-lg h-10 flex items-center">
                <p className="text-sm text-indigo-600 font-medium">
                  {photos.length} {photos.length === 1 ? 'nuotrauka' : 'nuotraukos'}
                </p>
              </div>
              
              {photos.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm h-10"
                >
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Atsisiųsti visas ({photos.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-lg shadow-sm overflow-hidden group cursor-pointer">
                <div 
                  className="relative bg-gray-100" 
                  style={{ aspectRatio: '3/2' }}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.original_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(photo)
                      }}
                      className="p-2 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 transition-colors shadow-sm"
                      title="Atsisiųsti nuotrauką"
                    >
                      <Download className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate" title={photo.original_name}>
                    {photo.original_name}
                  </h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(photo.created_at).toLocaleDateString('lt-LT')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(selectedPhoto)
                }}
                className="p-3 bg-green-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
                title="Atsisiųsti nuotrauką"
              >
                <Download className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-3 bg-red-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.original_name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

