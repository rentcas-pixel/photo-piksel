'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types/database'
import Link from 'next/link'
import { Folder, Image as ImageIcon } from 'lucide-react'

interface Agency {
  id: string
  name: string
  unique_slug: string
}

export default function AgencyPublicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [agency, setAgency] = useState<Agency | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientPhotoCounts, setClientPhotoCounts] = useState<Record<string, number>>({})
  const [clientLastUpdated, setClientLastUpdated] = useState<Record<string, string>>({})

  useEffect(() => {
    if (slug) {
      fetchAgencyAndClients()
    }
  }, [slug])

  useEffect(() => {
    if (clients.length > 0) {
      fetchPhotoCounts()
    }
  }, [clients])

  const fetchAgencyAndClients = async () => {
    try {
      // Fetch agency by slug
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('unique_slug', slug)
        .single()

      if (agencyError || !agencyData) {
        router.push('/404')
        return
      }

      setAgency(agencyData)

      // Fetch clients for this agency
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', agencyData.id)
        .order('name', { ascending: true })

      if (!clientsError) {
        setClients(clientsData || [])
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/404')
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
        .order('created_at', { ascending: false })

      if (photos) {
        const counts: Record<string, number> = {}
        const lastUpdated: Record<string, string> = {}
        
        photos.forEach(photo => {
          const clientId = photo.campaign?.client_id
          if (clientId) {
            counts[clientId] = (counts[clientId] || 0) + 1
            if (!lastUpdated[clientId]) {
              lastUpdated[clientId] = photo.created_at
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!agency) {
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
        {agency && (
          <div className="flex items-center text-sm text-gray-600 mb-6">
            <span className="text-gray-900 font-medium">{agency.name}</span>
          </div>
        )}

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
            <div className="text-gray-300 mb-6">
              <Folder className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Nėra katalogų</h3>
            <p className="text-gray-500 text-lg">
              Šiuo metu nėra įkeltų katalogų
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/${slug}/${client.id}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-100 hover:border-indigo-200">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 mb-3">
                      <img src="/Folder.png" alt="Katalogas" className="w-full h-full" />
                    </div>
                    <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                      {client.name}
                    </h3>
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

