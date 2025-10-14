'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Campaign, Client, Photo } from '@/types/database'
import { Download, Image as ImageIcon, DownloadCloud, Trash2, ChevronRight, Upload, X, Plus, Edit } from 'lucide-react'
import JSZip from 'jszip'
import Link from 'next/link'

interface PhotoWithCampaign extends Photo {
  campaign: Campaign
}

export default function AdminCampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [agency, setAgency] = useState<{ id: string; name: string } | null>(null)
  const [photos, setPhotos] = useState<PhotoWithCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithCampaign | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
      fetchPhotos()
    }
  }, [campaignId])

  const fetchCampaign = async () => {
    try {
      // Fetch campaign data
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError) {
        console.error('Error fetching campaign:', campaignError)
        router.push('/admin')
        return
      }

      setCampaign(campaignData)

      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', campaignData.client_id)
        .single()

      if (!clientError && clientData) {
        setClient(clientData)

        // Fetch agency data
        const { data: agencyData, error: agencyError } = await supabase
          .from('agencies')
          .select('*')
          .eq('id', clientData.agency_id)
          .single()

        if (!agencyError && agencyData) {
          setAgency(agencyData)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          campaign:campaigns(*)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching photos:', error)
      } else {
        setPhotos(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      const dataTransfer = new DataTransfer()
      files.forEach(file => dataTransfer.items.add(file))
      await handleUploadPhotos(dataTransfer.files)
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

  const handleUploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, file)
        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }
        
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName)
        await supabase.from('photos').insert({
          campaign_id: campaignId,
          filename: fileName,
          original_name: file.name,
          url: publicUrl,
        })
      }
      
      fetchPhotos()
    } catch (error) {
      console.error('Error uploading photos:', error)
      alert('Klaida įkeliant nuotraukas')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Klaida trinant nuotrauką')
    }
  }

  const handleEditClick = () => {
    if (campaign) {
      setEditName(campaign.name)
      setEditDescription(campaign.description || '')
      setShowEditModal(true)
    }
  }

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editName.trim()) {
      alert('Įveskite kampanijos pavadinimą')
      return
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
        })
        .eq('id', campaignId)

      if (error) {
        console.error('Error updating campaign:', error)
        alert('Klaida atnaujinant kampaniją')
      } else {
        setShowEditModal(false)
        fetchCampaign()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Klaida atnaujinant kampaniją')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Kampanija nerasta</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {agency && client && (
        <div className="flex items-center text-sm text-gray-600">
          <Link href="/admin" className="hover:text-indigo-600">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/admin/agencies/${agency.id}`} className="hover:text-indigo-600">
            {agency.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href={`/admin/clients/${client.id}`} className="hover:text-indigo-600">
            {client.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900 font-medium">{campaign.name}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-gray-600 mt-1">{campaign.description}</p>
              )}
            </div>
            <button
              onClick={handleEditClick}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Redaguoti kampaniją"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 px-4 py-2 rounded-lg h-10 flex items-center">
              <p className="text-sm text-indigo-600 font-medium">
                {photos.length} {photos.length === 1 ? 'nuotrauka' : 'nuotraukos'}
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleUploadPhotos(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm h-10 disabled:opacity-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">{uploading ? 'Įkeliama...' : 'Įkelti nuotraukas'}</span>
            </button>
            
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

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400'
        }`}
      >
        <Upload className={`mx-auto h-8 w-8 mb-3 ${isDragOver ? 'text-indigo-500' : 'text-gray-400'}`} />
        <p className={`text-sm ${isDragOver ? 'text-indigo-600' : 'text-gray-600'}`}>
          Vilkite nuotraukas čia arba naudokite mygtuką viršuje
        </p>
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Plus className="h-6 w-6 text-gray-700" />
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePhoto(photo.id)
                    }}
                    className="p-2 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 transition-colors shadow-sm"
                    title="Ištrinti nuotrauką"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate" title={photo.original_name}>
                  {photo.original_name}
                </h3>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(photo.created_at).toLocaleDateString('lt-LT')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-7xl max-h-full">
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

      {/* Edit Campaign Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Redaguoti kampaniją</h2>
            
            <form onSubmit={handleUpdateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kampanijos pavadinimas *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aprašymas (neprivaloma)
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditName('')
                    setEditDescription('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Išsaugoti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

