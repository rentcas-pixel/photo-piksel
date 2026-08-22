'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Campaign, Client, Photo } from '@/types/database'
import { Download, Image as ImageIcon, DownloadCloud, Trash2, ChevronRight, Upload, X, Plus, Edit, Copy, Check } from 'lucide-react'
import JSZip from 'jszip'
import Link from 'next/link'
import { adminApiRequest } from '@/lib/admin-fetch'

interface PhotoWithCampaign extends Photo {
  campaign: Campaign
}

const VERCEL_UPLOAD_LIMIT_BYTES = 3_500_000

export default function AdminCampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [agency, setAgency] = useState<{ id: string; name: string; unique_slug: string } | null>(null)
  const [clientShareUrl, setClientShareUrl] = useState('')
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [photos, setPhotos] = useState<PhotoWithCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithCampaign | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
      fetchPhotos()
    }
  }, [campaignId])

  useEffect(() => {
    if (typeof window === 'undefined' || !campaign?.id) {
      setClientShareUrl('')
      return
    }
    const origin = window.location.origin
    if (campaign.share_code) {
      setClientShareUrl(`${origin}/p/${campaign.share_code}`)
      return
    }
    if (agency?.unique_slug && client?.id) {
      setClientShareUrl(`${origin}/${agency.unique_slug}/${client.id}/${campaign.id}`)
      return
    }
    setClientShareUrl('')
  }, [agency, client, campaign])

  const copyClientShareLink = async () => {
    if (!campaign) return

    const copyUrl = (url: string) => {
      navigator.clipboard.writeText(url)
      setCopiedShareLink(true)
      setTimeout(() => setCopiedShareLink(false), 2000)
    }

    const origin =
      typeof window !== 'undefined' ? window.location.origin : ''

    if (campaign.share_code) {
      copyUrl(`${origin}/p/${campaign.share_code}`)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      alert('Sesija pasibaigė. Prisijunkite iš naujo.')
      return
    }

    const res = await fetch(`/api/campaigns/${campaign.id}/share-code`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      alert((json as { error?: string }).error || 'Nepavyko sugeneruoti trumpos nuorodos')
      return
    }

    const code = (json as { share_code?: string }).share_code
    if (!code) {
      alert('Nepavyko sugeneruoti trumpos nuorodos')
      return
    }

    setCampaign((prev) => (prev ? { ...prev, share_code: code } : null))
    copyUrl(`${origin}/p/${code}`)
  }

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
    
    const filesArray = Array.from(files)
    const totalFiles = filesArray.length
    
    setUploading(true)
    setUploadProgress({ current: 0, total: totalFiles })
    
    let successCount = 0
    let errorCount = 0
    let lastUploadError = ''

    const compressImageToLimit = async (
      file: File,
      maxBytes: number
    ): Promise<File> => {
      if (!file.type.startsWith('image/') || file.size <= maxBytes) {
        return file
      }
      try {
        const imageBitmap = await createImageBitmap(file)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) return file

        let scale = 1
        let quality = 0.88
        let outputBlob: Blob | null = null

        // Aggressively reduce dimensions/quality to stay under Vercel multipart limits.
        for (let attempt = 0; attempt < 14; attempt++) {
          canvas.width = Math.max(1, Math.round(imageBitmap.width * scale))
          canvas.height = Math.max(1, Math.round(imageBitmap.height * scale))
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)

          outputBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', quality)
          })

          if (outputBlob && outputBlob.size <= maxBytes) {
            break
          }

          quality = Math.max(0.35, quality - 0.07)
          scale = Math.max(0.4, scale * 0.88)
        }

        imageBitmap.close()

        if (!outputBlob || outputBlob.size > maxBytes) {
          throw new Error('File too large even after compression')
        }

        const stem = file.name.replace(/\.[^.]+$/, '')
        const safeStem = stem || 'photo'
        const compressedName = `${safeStem}.jpg`
        return new File([outputBlob], compressedName, { type: 'image/jpeg' })
      } catch (compressionError) {
        console.error('Compression failed:', compressionError)
        return file
      }
    }
    
    try {
      // Upload files one by one to avoid timeout
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i]
        
        try {
          const preparedFile = await compressImageToLimit(file, VERCEL_UPLOAD_LIMIT_BYTES)
          if (preparedFile.size > VERCEL_UPLOAD_LIMIT_BYTES) {
            throw new Error('Nuotrauka per didelė. Bandykite mažesnį failą.')
          }
          const formData = new FormData()
          formData.append('file', preparedFile)
          formData.append('campaignId', campaignId)

          const response = await fetch('/api/upload-photo', {
            method: 'POST',
            body: formData,
          })

          const result = await response.json().catch(() => ({}))

          if (!response.ok) {
            const message =
              (result as { error?: string }).error ||
              `HTTP ${response.status}`
            console.error('Upload error:', message, result)
            if (i === 0) {
              lastUploadError = message
            }
            errorCount++
            setUploadProgress({ current: i + 1, total: totalFiles })
            continue
          }

          successCount++
        } catch (fileError) {
          console.error('Error uploading file:', file.name, fileError)
          errorCount++
        }
        
        // Update progress
        setUploadProgress({ current: i + 1, total: totalFiles })
      }
      
      if (successCount > 0 && errorCount === 0) {
        alert(`Sėkmingai įkelta ${successCount} nuotraukų`)
      } else if (successCount > 0 && errorCount > 0) {
        alert(`Įkelta: ${successCount} nuotraukų\nKlaidos: ${errorCount} nuotraukų`)
      } else if (errorCount > 0) {
        alert(
          lastUploadError
            ? `Nepavyko įkelti nuotraukų:\n${lastUploadError}`
            : 'Nepavyko įkelti nuotraukų. Patikrinkite Vercel Environment Variables (SUPABASE_SERVICE_ROLE_KEY).'
        )
      }
      
      // Refresh photos list
      fetchPhotos()
    } catch (error) {
      console.error('Error uploading photos:', error)
      alert('Klaida įkeliant nuotraukas')
    } finally {
      setUploading(false)
      setUploadProgress({ current: 0, total: 0 })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (deletingPhotoId) return
    if (!confirm('Ar tikrai norite ištrinti šią nuotrauką?')) return

    setDeletingPhotoId(photoId)
    try {
      const result = await adminApiRequest(`/api/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (!result.ok) {
        console.error('Error deleting photo:', result.error)
        alert(result.error)
        return
      }

      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
      setSelectedPhoto((prev) => (prev?.id === photoId ? null : prev))
    } catch (error) {
      console.error('Error:', error)
      alert('Klaida trinant nuotrauką')
    } finally {
      setDeletingPhotoId(null)
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Sesija pasibaigė. Prisijunkite iš naujo.')
        return
      }

      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error('Error updating campaign:', json)
        alert((json as { error?: string }).error || 'Klaida atnaujinant kampaniją')
        return
      }

      setShowEditModal(false)
      fetchCampaign()
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
              type="button"
              onClick={handleEditClick}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              title="Redaguoti kampaniją"
            >
              <Edit className="h-4 w-4" />
              Redaguoti
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 px-4 py-2 rounded-lg h-10 flex items-center">
              <p className="text-sm text-indigo-600 font-medium">
                {photos.length} {photos.length === 1 ? 'nuotrauka' : 'nuotraukos'}
              </p>
            </div>

            {clientShareUrl && (
              <button
                type="button"
                onClick={() => void copyClientShareLink()}
                title="Trumpa nuoroda el. laiškui: /p/… — pirmiausia brand cover, tada galerija (be admin prisijungimo)."
                className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-800 rounded-lg hover:bg-gray-50 transition-colors shadow-sm h-10"
              >
                {copiedShareLink ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-sm font-medium">Nukopijuota</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Kopijuoti</span>
                  </>
                )}
              </button>
            )}
            
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
              <span className="text-sm font-medium">
                {uploading 
                  ? `Įkeliama ${uploadProgress.current}/${uploadProgress.total}...` 
                  : 'Įkelti nuotraukas'}
              </span>
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
            <div key={photo.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                type="button"
                className="relative block w-full bg-gray-100 cursor-pointer"
                style={{ aspectRatio: '3/2' }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.original_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <Plus className="h-6 w-6 text-gray-700" />
                  </div>
                </div>
              </button>
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 truncate" title={photo.original_name}>
                    {photo.original_name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(photo.created_at).toLocaleDateString('lt-LT')}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => void handleDownload(photo)}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Atsisiųsti nuotrauką"
                    aria-label="Atsisiųsti nuotrauką"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void handleDeletePhoto(photo.id)
                    }}
                    disabled={deletingPhotoId === photo.id}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Ištrinti nuotrauką"
                    aria-label="Ištrinti nuotrauką"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  void handleDownload(selectedPhoto)
                }}
                className="p-3 bg-green-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
                title="Atsisiųsti nuotrauką"
              >
                <Download className="h-6 w-6 text-white" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void handleDeletePhoto(selectedPhoto.id)
                }}
                disabled={deletingPhotoId === selectedPhoto.id}
                className="p-3 bg-red-600 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors disabled:opacity-50"
                title="Ištrinti nuotrauką"
              >
                <Trash2 className="h-6 w-6 text-white" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-3 bg-gray-700 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
                title="Uždaryti"
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

