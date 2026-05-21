'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Edit, Trash2, Users, Building2, Copy, Check, ChevronDown, Search, Square, ChevronRight } from 'lucide-react'
import { useAdminModals } from './layout'

interface Agency {
  id: string
  name: string
  email: string
  unique_slug: string
  created_at: string
}

interface ClientSearchResult {
  id: string
  name: string
  created_at: string
  agency?: {
    name: string
  } | Array<{
    name: string
  }> | null
}

export default function AdminPage() {
  const { showAgencyModal, showPhotoModal } = useAdminModals()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [clients, setClients] = useState<ClientSearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAgencies = useCallback(async () => {
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
    }
  }, [])

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          created_at,
          agency:agencies(name)
        `)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching clients:', error)
      } else {
        setClients(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      await Promise.all([fetchAgencies(), fetchClients()])
    } finally {
      setLoading(false)
    }
  }, [fetchAgencies, fetchClients])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const getAgencyName = (client: ClientSearchResult) => {
    if (Array.isArray(client.agency)) {
      return client.agency[0]?.name || ''
    }

    return client.agency?.name || ''
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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredClients = normalizedSearchTerm
    ? clients.filter((client) =>
        client.name.toLowerCase().includes(normalizedSearchTerm) ||
        getAgencyName(client).toLowerCase().includes(normalizedSearchTerm)
      )
    : []

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
        <div />
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

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Ieškoti kliento katalogo arba agentūros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {normalizedSearchTerm ? (
        filteredClients.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
            <div className="text-gray-300 mb-6">
              <Square className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Klientų nerasta</h3>
            <p className="text-gray-500 text-lg">Pabandykite įvesti kitą kliento ar agentūros pavadinimą</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {filteredClients.map((client) => (
                <li key={client.id} className="hover:bg-gray-50/90 transition-colors group">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="flex items-center gap-4 px-5 py-4 min-w-0"
                  >
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 shrink-0">
                      <Square className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate" title={client.name}>
                        {client.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate" title={getAgencyName(client) || undefined}>
                        {getAgencyName(client) || 'Be agentūros'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 shrink-0 transition-colors" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : agencies.length === 0 ? (
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
