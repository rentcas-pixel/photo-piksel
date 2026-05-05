'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types/database'
import Link from 'next/link'
import { Search, Square, Image as ImageIcon, Plus, ChevronDown, Upload, ChevronRight, Trash2 } from 'lucide-react'
import { useAdminModals } from '../../layout'

export default function AgencyClientsPage() {
  const params = useParams()
  const router = useRouter()
  const agencyId = params.id as string
  const { showClientModal, showPhotoModal } = useAdminModals()

  const [agency, setAgency] = useState<{ id: string; name: string } | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientPhotoCounts, setClientPhotoCounts] = useState<Record<string, number>>({})
  const [clientLastUpdated, setClientLastUpdated] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (agencyId) {
      fetchAgency()
      fetchClients()
      fetchPhotoCounts()
    }
  }, [agencyId])

  const fetchAgency = async () => {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', agencyId)
        .single()

      if (error) {
        console.error('Error fetching agency:', error)
        router.push('/admin/agencies')
      } else {
        setAgency(data)
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/admin/agencies')
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching clients:', error)
      } else {
        setClients(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPhotoCounts = async () => {
    try {
      const { data: photos } = await supabase
        .from('photos')
        .select(`
          campaign_id,
          created_at,
          campaign:campaigns(client_id)
        `)
        .order('created_at', { ascending: false }) as { data: unknown[] | null }

      if (photos) {
        const counts: Record<string, number> = {}
        const lastUpdated: Record<string, string> = {}
        
        photos.forEach((photo: unknown) => {
          const clientId = (photo as {campaign?: {client_id?: string}})?.campaign?.client_id
          if (clientId) {
            counts[clientId] = (counts[clientId] || 0) + 1
            if (!lastUpdated[clientId]) {
              lastUpdated[clientId] = (photo as {created_at: string}).created_at
            }
          }
        })
        
        setClientPhotoCounts(counts)
        setClientLastUpdated(lastUpdated)
      }
    } catch (error) {
      console.error('Error fetching photo counts:', error)
    }
  }

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Ar tikrai norite ištrinti šį klientą? Bus ištrinti visos jo nuotraukos.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) {
        console.error('Error deleting client:', error)
        alert('Klaida trinant klientą')
      } else {
        setClients(clients.filter(client => client.id !== clientId))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Klaida trinant klientą')
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
      {/* Breadcrumb */}
      {agency && (
        <div className="flex items-center text-sm text-gray-600">
          <Link href="/admin" className="hover:text-indigo-600">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900 font-medium">{agency.name}</span>
        </div>
      )}

      {/* Agency Header */}
      {agency && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-1 min-w-0">
              <div className="shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">{agency.name}</h1>
                <p className="text-gray-600 mt-1 text-sm">Klientų katalogai</p>
              </div>
              <div className="relative max-w-md flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ieškoti klientų..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
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
                        showClientModal(agencyId)
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <Square className="h-4 w-4 mr-3 text-indigo-600" />
                      Klientas
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        showPhotoModal()
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-3 text-green-600" />
                      Įkelti foto
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredClients.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="text-gray-300 mb-6">
            <Square className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            {searchTerm ? 'Nerasta klientų' : 'Nėra klientų'}
          </h3>
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'Pabandykite pakeisti paieškos kriterijus' : 'Ši agentūra dar neturi klientų'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filteredClients.map((client) => (
              <li key={client.id} className="flex items-stretch hover:bg-gray-50/90 transition-colors group">
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="flex flex-1 items-center gap-4 px-5 py-4 min-w-0"
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-gray-900 truncate" title={client.name}>
                      {client.name}
                    </p>
                    {clientLastUpdated[client.id] ? (
                      <p className="text-sm text-gray-500 mt-0.5">
                        Paskutinis atnaujinimas:{' '}
                        {new Date(clientLastUpdated[client.id]).toLocaleDateString('lt-LT')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-0.5">Dar nėra nuotraukų</p>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm text-gray-600 tabular-nums shrink-0">
                    <ImageIcon className="h-4 w-4 text-gray-400" aria-hidden />
                    {clientPhotoCounts[client.id] || 0}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 shrink-0 transition-colors" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDeleteClient(client.id)}
                  className="shrink-0 px-4 flex items-center border-l border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Ištrinti klientą"
                  aria-label="Ištrinti klientą"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

