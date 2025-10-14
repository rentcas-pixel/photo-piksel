'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types/database'
import Link from 'next/link'
import { Search, Square, Image as ImageIcon, Plus } from 'lucide-react'
import { useAdminModals } from '../layout'

interface ClientWithAgency extends Client {
  agency?: {
    name: string
  }
}

export default function AdminClientsPage() {
  const { showAgencyModal, showClientModal, showPhotoModal } = useAdminModals()
  const [clients, setClients] = useState<ClientWithAgency[]>([])
  const [loading, setLoading] = useState(true)
  const [clientPhotoCounts, setClientPhotoCounts] = useState<Record<string, number>>({})
  const [clientLastUpdated, setClientLastUpdated] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClients()
    fetchPhotoCounts()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          agency:agencies(name)
        `)
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
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.agency?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-gray-900">Visi klientai</h1>
          <p className="text-gray-600">Visų agentūrų klientai</p>
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

      {/* Search Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative max-w-md">
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

      {filteredClients.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <div className="text-gray-300 mb-6">
            <Square className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            {searchTerm ? 'Nerasta klientų' : 'Nėra klientų'}
          </h3>
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'Pabandykite pakeisti paieškos kriterijus' : 'Klientų sąrašas tuščias'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-center cursor-pointer border border-gray-100 hover:border-indigo-300">
                <div className="mb-4">
                  <Square className="mx-auto h-16 w-16 text-indigo-500 group-hover:text-indigo-600 transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 truncate" title={client.name}>
                  {client.name}
                </h3>
                <p className="text-xs text-gray-500 truncate mb-2" title={client.agency?.name}>
                  {client.agency?.name || 'Nėra agentūros'}
                </p>
                <div className="flex items-center justify-center text-sm text-gray-600 mb-1">
                  <ImageIcon className="h-4 w-4 mr-1" />
                  <span>{clientPhotoCounts[client.id] || 0}</span>
                </div>
                {clientLastUpdated[client.id] && (
                  <p className="text-xs text-gray-500">
                    {new Date(clientLastUpdated[client.id]).toLocaleDateString('lt-LT')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

