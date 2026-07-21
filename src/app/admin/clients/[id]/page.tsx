'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Campaign } from '@/types/database'
import { Folder, ChevronRight, Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

export default function AdminClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [agency, setAgency] = useState<{ id: string; name: string } | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignDescription, setNewCampaignDescription] = useState('')
  const [campaignPhotoCounts, setCampaignPhotoCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (clientId) {
      fetchClient()
      fetchCampaigns()
      fetchPhotoCounts()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) {
        console.error('Error fetching client:', clientError)
        router.push('/admin')
        return
      }

      setClient(clientData)

      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', clientData.agency_id)
        .single()

      if (!agencyError && agencyData) {
        setAgency(agencyData)
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching campaigns:', error)
      } else {
        setCampaigns(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchPhotoCounts = async () => {
    try {
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
      console.error('Error fetching photo counts:', error)
    }
  }

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCampaignName.trim()) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Sesija pasibaigė. Prisijunkite iš naujo.')
        return
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          client_id: clientId,
          name: newCampaignName.trim(),
          description: newCampaignDescription.trim() || null,
        }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error('Error creating campaign:', json)
        alert((json as { error?: string }).error || 'Klaida kuriant kampaniją')
        return
      }

      setNewCampaignName('')
      setNewCampaignDescription('')
      setShowAddModal(false)
      fetchCampaigns()
    } catch (error) {
      console.error('Error:', error)
      alert('Klaida kuriant kampaniją')
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Ar tikrai norite ištrinti šią kampaniją? Bus ištrintos ir visos nuotraukos!')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Sesija pasibaigė. Prisijunkite iš naujo.')
        return
      }

      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error('Error deleting campaign:', json)
        alert((json as { error?: string }).error || 'Klaida trinant kampaniją')
        return
      }

      fetchCampaigns()
      fetchPhotoCounts()
    } catch (error) {
      console.error('Error:', error)
      alert('Klaida trinant kampaniją')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Klientas nerastas</h2>
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
          <Link href={`/admin/agencies/${agency.id}`} className="hover:text-indigo-600">
            {agency.name}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-900 font-medium">{client.name}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-1">Reklamos kampanijos</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 px-4 py-2 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">
                {campaigns.length} {campaigns.length === 1 ? 'kampanija' : campaigns.length < 10 ? 'kampanijos' : 'kampanijų'}
              </p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Nauja kampanija</span>
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns — sąrašas */}
      {campaigns.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="text-gray-300 mb-6">
            <Folder className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Nėra kampanijų</h3>
          <p className="text-gray-500 text-lg mb-6">
            Šiam klientui dar nėra sukurtų kampanijų
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Sukurti pirmą kampaniją
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="flex items-stretch hover:bg-gray-50/90 transition-colors group">
                <Link
                  href={`/admin/campaigns/${campaign.id}`}
                  className="flex flex-1 items-center gap-4 px-5 py-4 min-w-0"
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-gray-900 truncate" title={campaign.name}>
                      {campaign.name}
                    </p>
                    {campaign.description ? (
                      <p className="text-sm text-gray-500 truncate mt-0.5" title={campaign.description}>
                        {campaign.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="flex items-center gap-1.5 text-sm text-gray-600 tabular-nums shrink-0">
                    <ImageIcon className="h-4 w-4 text-gray-400" aria-hidden />
                    {campaignPhotoCounts[campaign.id] || 0}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 shrink-0 transition-colors" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDeleteCampaign(campaign.id)}
                  className="shrink-0 px-4 flex items-center border-l border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Ištrinti kampaniją"
                  aria-label="Ištrinti kampaniją"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nauja kampanija</h2>
            
            <form onSubmit={handleAddCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kampanijos pavadinimas *
                </label>
                <input
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="pvz. Vasaros kampanija 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aprašymas (neprivaloma)
                </label>
                <textarea
                  value={newCampaignDescription}
                  onChange={(e) => setNewCampaignDescription(e.target.value)}
                  placeholder="Trumpas kampanijos aprašymas..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setNewCampaignName('')
                    setNewCampaignDescription('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sukurti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
