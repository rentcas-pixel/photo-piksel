'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Photo } from '@/types/database'
import { Download, Image as ImageIcon, DownloadCloud, ChevronRight } from 'lucide-react'
import JSZip from 'jszip'
import Link from 'next/link'

interface PhotoWithClient extends Photo {
  client: Client
}

interface Agency {
  id: string
  name: string
  unique_slug: string
}

export default function ClientPublicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const clientId = params.clientId as string
  
  const [agency, setAgency] = useState<Agency | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [photos, setPhotos] = useState<PhotoWithClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug && clientId) {
      fetchData()
    }
  }, [slug, clientId])

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

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('client_id', clientId)
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

  const handleDownload = async (photo: PhotoWithClient) => {
    try {
      const extension = photo.original_name.split('.').pop() || 'jpg'
      const uploadDate = new Date(photo.created_at).toISOString().split('T')[0]
      const newFilename = `Piksel_${client?.name}_${uploadDate}.${extension}`
      
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
        const newFilename = `Piksel_${client?.name}_${uploadDate}_${i + 1}.${extension}`
        
        const response = await fetch(photo.url)
        const blob = await response.blob()
        zip.file(newFilename, blob)
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const uploadDate = new Date(photos[0].created_at).toISOString().split('T')[0]
      const zipFilename = `Piksel_${client?.name}_${uploadDate}.zip`
      
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

  if (!client || !agency) {
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
          <span className="text-gray-900 font-medium">{client.name}</span>
        </div>

        {/* Controls */}
        <div className="flex justify-end items-center mb-6">
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

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
            <div className="text-gray-300 mb-6">
              <ImageIcon className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Nėra nuotraukų</h3>
            <p className="text-gray-500 text-lg">
              Šiam katalogui dar nėra įkeltų nuotraukų
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                <div className="relative bg-gray-100" style={{ aspectRatio: '3/2' }}>
                  <img
                    src={photo.url}
                    alt={photo.original_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(photo)}
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
    </div>
  )
}

