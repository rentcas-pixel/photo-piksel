'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Photo, Campaign, Client } from '@/types/database'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useAdminModals } from '../layout'

interface PhotoWithDetails extends Photo {
  campaign: Campaign & {
    client: Client
  }
}

export default function AdminPhotosPage() {
  const { showAgencyModal, showClientModal, showPhotoModal } = useAdminModals()
  const [photos, setPhotos] = useState<PhotoWithDetails[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState('')

  useEffect(() => {
    fetchPhotos()
    fetchCampaigns()
  }, [])

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          campaign:campaigns(
            *,
            client:clients(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching photos:', error)
      } else {
        setPhotos(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          client:clients(*)
        `)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching campaigns:', error)
      } else {
        setCampaigns(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Ar tikrai norite ištrinti šią nuotrauką?')) return

    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)

      if (error) {
        console.error('Error deleting photo:', error)
        alert('Klaida trinant nuotrauką')
      } else {
        setPhotos(photos.filter(photo => photo.id !== photoId))
        alert('Nuotrauka sėkmingai ištrinta')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Klaida trinant nuotrauką')
    }
  }

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.campaign?.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.campaign?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCampaign = !selectedCampaign || photo.campaign_id === selectedCampaign
    return matchesSearch && matchesCampaign
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuotraukų valdymas</h1>
          <p className="text-gray-600">Įkelkite ir valdykite visų kampanijų nuotraukas</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={showAgencyModal}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Pridėti agentūrą
          </button>
          <button
            onClick={() => showClientModal()}
            className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Pridėti klientą
          </button>
          <button
            onClick={showPhotoModal}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Įkelti nuotraukas
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ieškoti nuotraukų..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Visos kampanijos</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.client?.name} / {campaign.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredPhotos.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nerasta nuotraukų' : 'Nėra nuotraukų'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Pabandykite kitą paieškos terminą' 
              : 'Pradėkite įkeldami pirmąsias nuotraukas'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative bg-gray-100" style={{ aspectRatio: '3/2' }}>
                <img
                  src={photo.url}
                  alt={photo.original_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate" title={photo.original_name}>
                  {photo.original_name}
                </h3>
                <p className="text-sm text-gray-600 truncate" title={`${photo.campaign?.client?.name} / ${photo.campaign?.name}`}>
                  {photo.campaign?.client?.name} / {photo.campaign?.name}
                </p>
                <div className="flex justify-end items-center mt-2">
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Ištrinti nuotrauką"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
