'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { 
  LogOut, 
  X
} from 'lucide-react'
import { useEffect, useState, createContext, useContext, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Toast from '@/components/Toast'

// Create context for modals
const AdminModalsContext = createContext<{
  showAgencyModal: () => void
  showClientModal: (agencyId?: string) => void
  showPhotoModal: () => void
} | null>(null)

export const useAdminModals = () => {
  const context = useContext(AdminModalsContext)
  if (!context) throw new Error('useAdminModals must be used within AdminLayout')
  return context
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  
  // Modal states
  const [showAgencyModal, setShowAgencyModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  
  // Form states
  const [agencyName, setAgencyName] = useState('')
  
  const [clientName, setClientName] = useState('')
  const [clientAgency, setClientAgency] = useState('')
  const [preselectedAgency, setPreselectedAgency] = useState<string | null>(null)
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([])
  
  const [uploadCampaignId, setUploadCampaignId] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [clients, setClients] = useState<{ id: string; name: string; agency_id: string }[]>([])
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; client: { name: string } }>>([])
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  useEffect(() => {
    // Check if user is admin (admin@piksel.lt or renatas@piksel.lt)
    const adminEmails = ['admin@piksel.lt', 'renatas@piksel.lt']
    console.log('Admin layout - Current user:', user?.email)
    if (user && !adminEmails.includes(user.email || '')) {
      console.log('User is not admin, redirecting to login')
      router.push('/login')
    } else if (user && adminEmails.includes(user.email || '')) {
      console.log('User is admin, fetching data')
      fetchAgencies()
      fetchClients()
      fetchCampaigns()
    }
  }, [user, router])
  
  const fetchAgencies = async () => {
    const { data } = await supabase.from('agencies').select('*').order('name', { ascending: true })
    setAgencies(data || [])
  }
  
  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('name', { ascending: true })
    setClients(data || [])
  }

  const fetchCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*, client:clients(name)')
      .order('name', { ascending: true })
    setCampaigns(data || [])
  }
  
  const generateSlug = (name: string) => {
    const randomStr = Math.random().toString(36).substring(2, 10)
    return `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${randomStr}`
  }

  const handleCreateAgency = async () => {
    if (!agencyName) {
      showToast('Įveskite agentūros pavadinimą', 'error')
      return
    }
    
    setUploading(true)
    try {
      const uniqueSlug = generateSlug(agencyName)
      
      const { error } = await supabase
        .from('agencies')
        .insert({ name: agencyName, unique_slug: uniqueSlug })
      
      if (error) {
        showToast('Klaida kuriant agentūrą: ' + error.message, 'error')
      } else {
        showToast('Katalogas sėkmingai sukurtas!')
        setShowAgencyModal(false)
        setAgencyName('')
        await fetchAgencies()
        // Force page refresh to show new agency
        window.location.reload()
      }
    } catch (error) {
      showToast('Klaida kuriant agentūrą', 'error')
    } finally {
      setUploading(false)
    }
  }
  
  const handleCreateClient = async () => {
    if (!clientName || !clientAgency) {
      showToast('Užpildykite visus laukus', 'error')
      return
    }
    
    setUploading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({ name: clientName, agency_id: clientAgency })
        .select()
        .single()
      
      if (error) {
        showToast('Klaida kuriant klientą: ' + error.message, 'error')
      } else {
        showToast('Klientas sėkmingai sukurtas!')
        setShowClientModal(false)
        setClientName('')
        setClientAgency('')
        setPreselectedAgency(null)
        await fetchClients()
        // Navigate to the new client page
        router.push(`/admin/clients/${data.id}`)
      }
    } catch (error) {
      showToast('Klaida kuriant klientą', 'error')
    } finally {
      setUploading(false)
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      setSelectedFiles(files)
    }
  }

  const handleUploadPhotos = async () => {
    if (!uploadCampaignId || selectedFiles.length === 0) {
      showToast('Pasirinkite kampaniją ir nuotraukas', 'error')
      return
    }
    
    setUploading(true)
    let successCount = 0
    let errorCount = 0
    
    try {
      for (const file of selectedFiles) {
        try {
          // Use API route with Service Role Key (bypasses RLS)
          const formData = new FormData()
          formData.append('file', file)
          formData.append('campaignId', uploadCampaignId)
          
          const response = await fetch('/api/upload-photo', {
            method: 'POST',
            body: formData,
          })
          
          const result = await response.json()
          
          if (!response.ok) {
            console.error('Upload error:', result.error)
            showToast(`Klaida įkeliant ${file.name}: ${result.error}`, 'error')
            errorCount++
            continue
          }
          
          successCount++
        } catch (fileError) {
          console.error('Error uploading file:', file.name, fileError)
          showToast(`Klaida įkeliant ${file.name}`, 'error')
          errorCount++
        }
      }
      
      if (successCount > 0) {
        showToast(`Sėkmingai įkelta ${successCount} nuotraukų${errorCount > 0 ? ` (${errorCount} klaidų)` : ''}`)
        setShowPhotoModal(false)
        setSelectedFiles([])
        setUploadCampaignId('')
        router.refresh()
      } else {
        showToast('Nepavyko įkelti nė vienos nuotraukos. Patikrinkite, ar pridėjote SUPABASE_SERVICE_ROLE_KEY į .env.local', 'error')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showToast('Klaida įkeliant nuotraukas: ' + (error instanceof Error ? error.message : 'Nežinoma klaida'), 'error')
    } finally {
      setUploading(false)
    }
  }

  const adminEmails = ['admin@piksel.lt', 'renatas@piksel.lt']
  if (user && !adminEmails.includes(user.email || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Prieiga draudžiama</h1>
          <p className="text-gray-600">Jūs neturite administratoriaus teisių.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src="/Piksel-logo-black-2023.png"
                alt="Piksel"
                className="h-8 w-auto"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-gray-600"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main content - Full Width */}
        <div className="max-w-7xl mx-auto">
          <AdminModalsContext.Provider value={{
            showAgencyModal: () => setShowAgencyModal(true),
            showClientModal: (agencyId?: string) => {
              if (agencyId) {
                setPreselectedAgency(agencyId)
                setClientAgency(agencyId)
              }
              setShowClientModal(true)
            },
            showPhotoModal: () => setShowPhotoModal(true)
          }}>
            {children}
          </AdminModalsContext.Provider>
        </div>
        
        {/* Agency Modal */}
        {showAgencyModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Naujas katalogas</h2>
                <button onClick={() => setShowAgencyModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Katalogo pavadinimas</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Pvz. Open"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">Bus sukurta unikali nuoroda katalogui</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateAgency}
                    disabled={uploading}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {uploading ? 'Kuriama...' : 'Sukurti katalogą'}
                  </button>
                  <button
                    onClick={() => setShowAgencyModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Atšaukti
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Client Modal */}
        {showClientModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Naujas klientas</h2>
                <button onClick={() => {
                  setShowClientModal(false)
                  setPreselectedAgency(null)
                  setClientName('')
                  setClientAgency('')
                }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pavadinimas</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Pvz. Klientas ABC"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {!preselectedAgency && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Katalogas</label>
                    <select
                      value={clientAgency}
                      onChange={(e) => setClientAgency(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Pasirinkite katalogą...</option>
                      {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateClient}
                    disabled={uploading}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {uploading ? 'Kuriama...' : 'Sukurti'}
                  </button>
                  <button
                    onClick={() => {
                      setShowClientModal(false)
                      setPreselectedAgency(null)
                      setClientName('')
                      setClientAgency('')
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Atšaukti
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Photo Upload Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Įkelti nuotraukas</h2>
                <button onClick={() => {
                  setShowPhotoModal(false)
                  setSelectedFiles([])
                  setUploadCampaignId('')
                }} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pasirinkite kampaniją</label>
                  <select
                    value={uploadCampaignId}
                    onChange={(e) => setUploadCampaignId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Pasirinkite kampaniją...</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.client?.name} / {campaign.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pasirinkite nuotraukas</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && setSelectedFiles(Array.from(e.target.files))}
                    className="hidden"
                  />
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragOver 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-gray-600">
                        {selectedFiles.length > 0 
                          ? `Pasirinkta failų: ${selectedFiles.length}` 
                          : 'Vilkite failus čia arba paspauskite pasirinkti'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleUploadPhotos}
                    disabled={uploading}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {uploading ? 'Įkeliama...' : 'Įkelti'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPhotoModal(false)
                      setSelectedFiles([])
                      setUploadCampaignId('')
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Atšaukti
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}