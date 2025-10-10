'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Edit, Trash2, Users, Building2, Copy, Check, ChevronDown } from 'lucide-react'
import { useAdminModals } from './layout'

interface Agency {
  id: string
  name: string
  email: string
  unique_slug: string
  created_at: string
}

export default function AdminPage() {
  const { showAgencyModal, showPhotoModal } = useAdminModals()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchAgencies()
  }, [])

  const fetchAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching agencies:', error)
      } else {
        setAgencies(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const handleDeleteAgency = async (agencyId: string) => {
    if (!confirm('Ar tikrai norite ištrinti šią agentūrą? Bus ištrinti visi jos klientai ir nuotraukos.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', agencyId)

      if (error) {
        console.error('Error deleting agency:', error)
        alert('Klaida trinant agentūrą')
      } else {
        setAgencies(agencies.filter(agency => agency.id !== agencyId))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Klaida trinant agentūrą')
    }
  }

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
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Naujas
            <ChevronDown className="h-4 w-4 ml-2" />
          </button>
          
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    showAgencyModal()
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                >
                  <Building2 className="h-4 w-4 mr-3 text-indigo-600" />
                  Katalogas
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    showPhotoModal()
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-3 text-green-600" />
                  Įkelti foto
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {agencies.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="text-gray-300 mb-6">
            <Users className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Nėra katalogų</h3>
          <p className="text-gray-500 text-lg mb-4">Pradėkite pridėdami pirmą katalogą</p>
          <div className="relative inline-block">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Naujas
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      showAgencyModal()
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                  >
                    <Building2 className="h-4 w-4 mr-3 text-indigo-600" />
                    Katalogas
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      showPhotoModal()
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-3 text-green-600" />
                    Įkelti foto
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {agencies.map((agency) => (
            <div key={agency.id} className="group relative">
              {/* Action buttons - top right */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    copyToClipboard(agency.unique_slug)
                  }}
                  className="p-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shadow-md"
                  title="Kopijuoti nuorodą"
                >
                  {copiedSlug === agency.unique_slug ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <Link
                  href={`/admin/agencies/${agency.id}/edit`}
                  className="p-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shadow-md"
                  title="Redaguoti"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteAgency(agency.id)
                  }}
                  className="p-1.5 bg-white text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-md"
                  title="Ištrinti"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <Link href={`/admin/agencies/${agency.id}`}>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-center cursor-pointer border border-gray-100 hover:border-indigo-300">
                  <div className="mb-4">
                    <img src="/Folder.png" alt="Katalogas" className="mx-auto h-16 w-16" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 truncate" title={agency.name}>
                    {agency.name}
                  </h3>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
