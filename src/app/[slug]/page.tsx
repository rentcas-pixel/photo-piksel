'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types/database'
import Link from 'next/link'
import { Clock, Folder, Image as ImageIcon } from 'lucide-react'
import { FeatureSuggestionSection } from '@/components/FeatureSuggestionSection'
import {
  clientActivityIso,
  clientActivityTime,
  formatActivityPrimary,
} from '@/lib/activity-dates'

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

      // Fetch clients for this agency (pavadinimas – antrinis; galutinė tvarka pagal veiklą žemiau)
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('agency_id', agencyData.id)
        .order('updated_at', { ascending: false })

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

  const sortedClients = useMemo(() => {
    if (!clients.length) return []
    return [...clients].sort(
      (a, b) =>
        clientActivityTime(b, clientLastUpdated) -
        clientActivityTime(a, clientLastUpdated)
    )
  }, [clients, clientLastUpdated])

  const peakActivityTime = useMemo(() => {
    if (!sortedClients.length) return 0
    return Math.max(
      ...sortedClients.map((c) => clientActivityTime(c, clientLastUpdated))
    )
  }, [sortedClients, clientLastUpdated])

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <img
              src="/Piksel-logo-juodas-2026.png"
              alt="Piksel"
              className="h-8 w-auto"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 min-h-0">
        {/* Breadcrumb */}
        {agency && (
          <div className="flex items-center text-sm text-gray-600 mb-6 shrink-0">
            <span className="text-gray-900 font-medium">{agency.name}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
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
                {sortedClients.map((client) => {
                  const activityIso = clientActivityIso(client, clientLastUpdated)
                  const activityTs = clientActivityTime(client, clientLastUpdated)
                  const isNewest =
                    peakActivityTime > 0 && activityTs === peakActivityTime

                  return (
                    <Link
                      key={client.id}
                      href={`/${slug}/${client.id}`}
                      className="group relative"
                    >
                      {isNewest && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                          Naujausia
                        </span>
                      )}
                      <div
                        className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border hover:border-indigo-200 h-full ${
                          isNewest
                            ? 'border-indigo-300 ring-1 ring-indigo-100'
                            : 'border-gray-100'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 mb-3">
                            <img
                              src="/Folder.png"
                              alt="Katalogas"
                              className="w-full h-full"
                            />
                          </div>
                          <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-2">
                            {client.name}
                          </h3>
                          <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
                            <ImageIcon className="h-4 w-4 mr-1 shrink-0" />
                            <span>{clientPhotoCounts[client.id] || 0}</span>
                          </div>
                          <div
                            className="flex items-start gap-1 text-xs text-gray-600 w-full justify-center"
                            title={new Date(activityIso).toLocaleString('lt-LT')}
                          >
                            <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
                            <span className="text-left leading-snug">
                              <span className="text-gray-500 block">
                                Paskutinis atnaujinimas
                              </span>
                              <span className="font-medium text-gray-800">
                                {formatActivityPrimary(activityIso)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <FeatureSuggestionSection agencySlug={slug} context="agency_home" />
        </div>
      </div>
    </div>
  )
}

