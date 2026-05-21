'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Campaign, Client } from '@/types/database'
import Link from 'next/link'
import { ChevronRight, Clock, Folder, Image as ImageIcon, Search } from 'lucide-react'
import { FeatureSuggestionSection } from '@/components/FeatureSuggestionSection'
import { CampaignCoverView } from '@/components/CampaignCoverView'
import { formatCatalogCount } from '@/lib/catalog-label'
import { formatUploadedDate } from '@/lib/resolve-share-code'
import {
  campaignActivityIso,
  campaignActivityTime,
  clientActivityIso,
  clientActivityTime,
  formatActivityPrimary,
} from '@/lib/activity-dates'

interface Agency {
  id: string
  name: string
  unique_slug: string
}

const CATALOGS_SECTION_ID = 'agency-catalogs'

function matchesSearch(text: string | undefined | null, query: string): boolean {
  if (!query) return true
  return (text ?? '').toLowerCase().includes(query)
}

export default function AgencyPublicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [agency, setAgency] = useState<Agency | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [clientPhotoCounts, setClientPhotoCounts] = useState<Record<string, number>>({})
  const [clientLastUpdated, setClientLastUpdated] = useState<Record<string, string>>({})
  const [campaignPhotoCounts, setCampaignPhotoCounts] = useState<Record<string, number>>({})
  const [campaignLastPhotoAt, setCampaignLastPhotoAt] = useState<Record<string, string>>({})
  const [agencyLastPhotoAt, setAgencyLastPhotoAt] = useState<string | null>(null)

  const clientById = useMemo(() => {
    const map = new Map<string, Client>()
    for (const c of clients) map.set(c.id, c)
    return map
  }, [clients])

  useEffect(() => {
    if (slug) {
      fetchAgencyAndClients()
    }
  }, [slug])

  useEffect(() => {
    if (clients.length > 0) {
      fetchCampaigns()
      fetchPhotoCounts()
    } else {
      setCampaigns([])
      setAgencyLastPhotoAt(null)
      setCampaignPhotoCounts({})
      setCampaignLastPhotoAt({})
    }
  }, [clients])

  const fetchAgencyAndClients = async () => {
    try {
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

  const fetchCampaigns = async () => {
    const clientIds = clients.map((c) => c.id)
    if (clientIds.length === 0) return

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .in('client_id', clientIds)
      .order('updated_at', { ascending: false })

    if (!error) {
      setCampaigns(data || [])
    }
  }

  const fetchPhotoCounts = async () => {
    try {
      const clientIds = new Set(clients.map((c) => c.id))
      const { data: photos } = (await supabase
        .from('photos')
        .select(`
          campaign_id,
          created_at,
          campaign:campaigns(client_id)
        `)
        .order('created_at', { ascending: false })) as { data: unknown[] | null }

      if (photos) {
        const clientCounts: Record<string, number> = {}
        const clientLast: Record<string, string> = {}
        const campCounts: Record<string, number> = {}
        const campLast: Record<string, string> = {}
        let latestAgency: string | null = null

        photos.forEach((photo: unknown) => {
          const row = photo as {
            campaign_id: string
            campaign?: { client_id?: string }
            created_at: string
          }
          const clientId = row.campaign?.client_id
          const campaignId = row.campaign_id
          if (!clientId || !clientIds.has(clientId)) return

          clientCounts[clientId] = (clientCounts[clientId] || 0) + 1
          campCounts[campaignId] = (campCounts[campaignId] || 0) + 1

          if (!clientLast[clientId]) clientLast[clientId] = row.created_at
          if (!campLast[campaignId]) campLast[campaignId] = row.created_at

          if (!latestAgency || new Date(row.created_at) > new Date(latestAgency)) {
            latestAgency = row.created_at
          }
        })

        setClientPhotoCounts(clientCounts)
        setClientLastUpdated(clientLast)
        setCampaignPhotoCounts(campCounts)
        setCampaignLastPhotoAt(campLast)
        setAgencyLastPhotoAt(latestAgency)
      }
    } catch (error) {
      console.error('Error fetching photo counts:', error)
    }
  }

  const scrollToCatalogs = useCallback(() => {
    document.getElementById(CATALOGS_SECTION_ID)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const sortedClients = useMemo(() => {
    if (!clients.length) return []
    return [...clients].sort(
      (a, b) =>
        clientActivityTime(b, clientLastUpdated) - clientActivityTime(a, clientLastUpdated)
    )
  }, [clients, clientLastUpdated])

  const sortedCampaigns = useMemo(() => {
    if (!campaigns.length) return []
    return [...campaigns].sort(
      (a, b) =>
        campaignActivityTime(b, campaignLastPhotoAt) -
        campaignActivityTime(a, campaignLastPhotoAt)
    )
  }, [campaigns, campaignLastPhotoAt])

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredCampaigns = useMemo(() => {
    if (!normalizedSearch) return []
    return sortedCampaigns.filter(
      (c) =>
        matchesSearch(c.name, normalizedSearch) ||
        matchesSearch(c.description, normalizedSearch)
    )
  }, [sortedCampaigns, normalizedSearch])

  const matchingCampaignClientIds = useMemo(() => {
    return new Set(filteredCampaigns.map((c) => c.client_id))
  }, [filteredCampaigns])

  const filteredClients = useMemo(() => {
    if (!normalizedSearch) return sortedClients
    return sortedClients.filter(
      (c) =>
        matchesSearch(c.name, normalizedSearch) || matchingCampaignClientIds.has(c.id)
    )
  }, [sortedClients, normalizedSearch, matchingCampaignClientIds])

  const hasSearchResults =
    !normalizedSearch || filteredClients.length > 0 || filteredCampaigns.length > 0

  const peakActivityTime = useMemo(() => {
    if (!sortedClients.length) return 0
    return Math.max(
      ...sortedClients.map((c) => clientActivityTime(c, clientLastUpdated))
    )
  }, [sortedClients, clientLastUpdated])

  const coverSubtitleLines = useMemo(() => {
    const lines = [formatCatalogCount(clients.length)]
    const dateLine = formatUploadedDate(agencyLastPhotoAt ?? undefined)
    lines.push(dateLine === '—' ? 'Dar nėra įkeltų nuotraukų' : dateLine)
    return lines
  }, [clients.length, agencyLastPhotoAt])

  const showSearch = clients.length > 0 || campaigns.length > 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!agency) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CampaignCoverView
        title={agency.name}
        subtitleLines={coverSubtitleLines}
        action={{ label: 'Peržiūrėti katalogus', onClick: scrollToCatalogs }}
      />

      <section
        id={CATALOGS_SECTION_ID}
        className="scroll-mt-4 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
      >
        {showSearch && (
          <div className="mb-6">
            <label htmlFor="agency-search" className="sr-only">
              Ieškoti
            </label>
            <div className="relative max-w-md">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none"
                aria-hidden
              />
              <input
                id="agency-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ieškoti..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        )}

        {clients.length === 0 && campaigns.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
            <div className="text-gray-300 mb-6">
              <Folder className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Nėra katalogų</h3>
            <p className="text-gray-500 text-lg">Šiuo metu nėra įkeltų katalogų</p>
          </div>
        ) : !hasSearchResults ? (
          <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Nerasta</h3>
            <p className="text-gray-500 text-lg">Pabandykite kitą paieškos terminą</p>
          </div>
        ) : (
          <div className="space-y-8">
            {normalizedSearch && filteredCampaigns.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Kampanijos
                </h2>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <ul className="divide-y divide-gray-100">
                    {filteredCampaigns.map((campaign) => {
                      const catalog = clientById.get(campaign.client_id)
                      const activityIso = campaignActivityIso(campaign, campaignLastPhotoAt)

                      return (
                        <li key={campaign.id}>
                          <Link
                            href={`/${slug}/${campaign.client_id}/${campaign.id}`}
                            className="flex items-center gap-4 px-5 py-4 min-w-0 transition-colors group hover:bg-gray-50/90"
                          >
                            <div className="flex-1 min-w-0 text-left">
                              <p className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                {campaign.name}
                              </p>
                              {catalog ? (
                                <p className="text-sm text-gray-500 mt-0.5 truncate">
                                  {catalog.name}
                                </p>
                              ) : null}
                              <div
                                className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600"
                                title={new Date(activityIso).toLocaleString('lt-LT')}
                              >
                                <span className="inline-flex items-center gap-1.5 tabular-nums">
                                  <ImageIcon className="h-4 w-4 text-gray-400 shrink-0" aria-hidden />
                                  {campaignPhotoCounts[campaign.id] || 0}
                                </span>
                                <span className="inline-flex items-start gap-1.5">
                                  <Clock className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" aria-hidden />
                                  <span className="font-medium text-gray-800">
                                    {formatActivityPrimary(activityIso)}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <ChevronRight
                              className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 shrink-0 transition-colors"
                              aria-hidden
                            />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )}

            {( !normalizedSearch || filteredClients.length > 0) && (
              <div>
                {normalizedSearch && (
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Katalogai
                  </h2>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {(normalizedSearch ? filteredClients : sortedClients).map((client) => {
                    const activityIso = clientActivityIso(client, clientLastUpdated)
                    const activityTs = clientActivityTime(client, clientLastUpdated)
                    const isNewest = peakActivityTime > 0 && activityTs === peakActivityTime

                    return (
                      <Link
                        key={client.id}
                        href={`/${slug}/${client.id}`}
                        className="group relative"
                      >
                        {isNewest && !normalizedSearch && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                            Naujausia
                          </span>
                        )}
                        <div
                          className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border hover:border-indigo-200 h-full ${
                            isNewest && !normalizedSearch
                              ? 'border-indigo-300 ring-1 ring-indigo-100'
                              : 'border-gray-100'
                          }`}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 mb-3">
                              <img src="/Folder.png" alt="Katalogas" className="w-full h-full" />
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
                                <span className="text-gray-500 block">Paskutinis atnaujinimas</span>
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
              </div>
            )}
          </div>
        )}

        <div className="mt-10">
          <FeatureSuggestionSection agencySlug={slug} context="agency_home" />
        </div>
      </section>
    </div>
  )
}
