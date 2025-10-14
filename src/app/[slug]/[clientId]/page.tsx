'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Campaign } from '@/types/database'
import { Folder, Image as ImageIcon, ChevronRight } from 'lucide-react'
import Link from 'next/link'

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
        .order('created_at', { ascending: false })

      if (!campaignsError) {
        setCampaigns(campaignsData || [])
      }

      // Fetch photo counts
      const { data: photos } = await supabase
        .from('photos')
        .select('campaign_id')

      if (photos) {
        const counts: Record<string, number> = {}
        photos.forEach(photo => {
          counts[photo.campaign_id] = (counts[photo.campaign_id] || 0) + 1
        })
        setCampaignPhotoCounts(counts)
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/404')
    } finally {
      setLoading(false)
    }
  }

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
        <div className="flex items-center text-sm text-gray-600 mb-6">
          <Link href={`/${slug}`} className="hover:text-indigo-600">
            {agency.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900 font-medium">{client.name}</span>
        </div>

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
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/${slug}/${clientId}/${campaign.id}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-100 hover:border-indigo-200">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 mb-3">
                      <img src="/Folder.png" alt="Kampanija" className="w-full h-full" />
                    </div>
                    <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                      {campaign.name}
                    </h3>
                    {campaign.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                    <div className="flex items-center justify-center text-sm text-gray-600">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      <span>{campaignPhotoCounts[campaign.id] || 0}</span>
                    </div>
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
