'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Campaign } from '@/types/database'
import { Clock, Folder, Image as ImageIcon, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { FeatureSuggestionSection } from '@/components/FeatureSuggestionSection'
import {
  campaignActivityIso,
  campaignActivityTime,
  formatActivityPrimary,
} from '@/lib/activity-dates'

interface Agency {
  id: string
  name: string
  unique_slug: string
}

export default function ClientPublicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const clientId = params.clientId as string
  
  const [agency, setAgency] = useState<Agency | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [campaignPhotoCounts, setCampaignPhotoCounts] = useState<Record<string, number>>({})
  const [newPhotosCount, setNewPhotosCount] = useState<Record<string, number>>({})
  const [campaignLastPhotoAt, setCampaignLastPhotoAt] = useState<
    Record<string, string>
  >({})

  useEffect(() => {
    if (slug && clientId) {
      fetchData()
    }
  }, [slug, clientId])

  const fetchData = async () => {
    try {
      // Fetch agency
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('unique_slug', slug)
        .single()

      if (!agencyData) {
        router.push('/404')
        return
      }

      setAgency(agencyData)

      // Fetch client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('agency_id', agencyData.id)
        .single()

      if (clientError || !clientData) {
        router.push(`/${slug}`)
        return
      }

      setClient(clientData)

      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false })

      const list = campaignsData || []
      if (!campaignsError) {
        setCampaigns(list)
      }

      const campaignIds = list.map((c) => c.id)

      // Fetch photo counts and new photos (tik šio kliento kampanijos)
      if (campaignIds.length === 0) {
        setCampaignPhotoCounts({})
        setNewPhotosCount({})
        setCampaignLastPhotoAt({})
      } else {
        const { data: photos } = await supabase
          .from('photos')
          .select('id, campaign_id, created_at')
          .in('campaign_id', campaignIds)
          .order('created_at', { ascending: false })

        if (photos) {
          const counts: Record<string, number> = {}
          const newCounts: Record<string, number> = {}
          const lastPhotoAt: Record<string, string> = {}

          const lastVisitsKey = `last_visits_${clientId}`
          const lastVisits = JSON.parse(localStorage.getItem(lastVisitsKey) || '{}')
          const today = new Date().toISOString()

          photos.forEach((photo) => {
            counts[photo.campaign_id] = (counts[photo.campaign_id] || 0) + 1

            if (!lastPhotoAt[photo.campaign_id]) {
              lastPhotoAt[photo.campaign_id] = photo.created_at
            }

            let lastVisit = lastVisits[photo.campaign_id]
            if (!lastVisit) {
              lastVisit = today
              lastVisits[photo.campaign_id] = lastVisit
              localStorage.setItem(lastVisitsKey, JSON.stringify(lastVisits))
            }

            const photoDate = new Date(photo.created_at)
            const visitDate = new Date(lastVisit)
            const isNewByDate = photoDate > visitDate

            const viewedPhotosKey = `viewed_photos_${clientId}_${photo.campaign_id}`
            const viewedPhotos = JSON.parse(
              localStorage.getItem(viewedPhotosKey) || '[]'
            )
            const isViewed = viewedPhotos.includes(photo.id)

            if (isNewByDate && !isViewed) {
              newCounts[photo.campaign_id] = (newCounts[photo.campaign_id] || 0) + 1
            }
          })

          setCampaignPhotoCounts(counts)
          setNewPhotosCount(newCounts)
          setCampaignLastPhotoAt(lastPhotoAt)
        } else {
          setCampaignPhotoCounts({})
          setNewPhotosCount({})
          setCampaignLastPhotoAt({})
        }
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/404')
    } finally {
      setLoading(false)
    }
  }

  const sortedCampaigns = useMemo(() => {
    if (!campaigns.length) return []
    return [...campaigns].sort(
      (a, b) =>
        campaignActivityTime(b, campaignLastPhotoAt) -
        campaignActivityTime(a, campaignLastPhotoAt)
    )
  }, [campaigns, campaignLastPhotoAt])

  const peakCampaignActivity = useMemo(() => {
    if (!sortedCampaigns.length) return 0
    return Math.max(
      ...sortedCampaigns.map((c) => campaignActivityTime(c, campaignLastPhotoAt))
    )
  }, [sortedCampaigns, campaignLastPhotoAt])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!client || !agency) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="shrink-0 bg-white shadow-sm border-b border-gray-200">
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

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 min-h-0">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-6 shrink-0">
          <Link href={`/${slug}`} className="hover:text-indigo-600">
            {agency.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900 font-medium">{client.name}</span>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            {/* Campaigns Grid */}
            {campaigns.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
                <div className="text-gray-300 mb-6">
                  <Folder className="mx-auto h-16 w-16" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Nėra kampanijų</h3>
                <p className="text-gray-500 text-lg">
                  Šiam katalogui dar nėra įkeltų kampanijų
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {sortedCampaigns.map((campaign) => {
                  const activityIso = campaignActivityIso(campaign, campaignLastPhotoAt)
                  const activityTs = campaignActivityTime(campaign, campaignLastPhotoAt)
                  const isNewest =
                    peakCampaignActivity > 0 && activityTs === peakCampaignActivity

                  return (
                    <Link
                      key={campaign.id}
                      href={`/${slug}/${clientId}/${campaign.id}`}
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
                              alt="Kampanija"
                              className="w-full h-full"
                            />
                          </div>
                          <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-2">
                            {campaign.name}
                          </h3>
                          {campaign.description && (
                            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                              {campaign.description}
                            </p>
                          )}
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <ImageIcon className="h-4 w-4 mr-1 shrink-0" />
                              <span>{campaignPhotoCounts[campaign.id] || 0}</span>
                            </div>
                            {newPhotosCount[campaign.id] > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {newPhotosCount[campaign.id]}
                              </span>
                            )}
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

          {agency && client && (
            <FeatureSuggestionSection
              agencySlug={slug}
              context="client"
              clientId={client.id}
              clientName={client.name}
            />
          )}
        </div>
      </div>
    </div>
  )
}
