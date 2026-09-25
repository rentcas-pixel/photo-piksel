'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Edit, Trash2, Folder, Copy, Check, Search, ChevronRight, Upload } from 'lucide-react'
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
  agency_id: string
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
          agency_id,
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

  const visibleAgencies = agencies.filter(agency => agency.name.toLocaleLowerCase('lt').includes(normalizedSearchTerm))
  return (
    <div className="space-y-8">
      <section className="proof-page-heading">
        <div><p className="proof-eyebrow">JŪSŲ DARBO ERDVĖ</p><h1>Agentūros.</h1><p className="proof-description">Tvarkykite agentūras, klientų katalogus ir kampanijų nuotraukas.</p></div>
        <div className="proof-actions"><button onClick={showPhotoModal} className="proof-secondary"><Upload size={17} />Įkelti nuotraukas</button><button onClick={showAgencyModal} className="proof-primary"><Plus size={17} />Nauja agentūra</button></div>
      </section>
      <div className="proof-stats"><div><strong>{agencies.length}</strong><span>Agentūros</span></div><div><strong>{clients.length}</strong><span>Klientų katalogai</span></div></div>
      <div className="proof-toolbar"><h2>{normalizedSearchTerm ? 'Paieškos rezultatai' : 'Visos agentūros'}</h2><label className="proof-search"><Search size={17} /><input aria-label="Ieškoti agentūros arba kliento" placeholder="Agentūra arba klientas…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></label></div>
      <div className="proof-rows">
        {visibleAgencies.map(agency => <div key={agency.id} className="proof-row"><Link href={`/admin/agencies/${agency.id}`} className="proof-entry"><span className="proof-folder"><Folder size={25} /></span><div><h2>{agency.name}</h2><p>Klientų katalogų: {clients.filter(client => client.agency_id === agency.id).length}</p></div><ChevronRight size={20} /></Link><div className="proof-actions"><button onClick={() => copyToClipboard(agency.unique_slug)} className="proof-icon" title="Kopijuoti viešą nuorodą" aria-label={`Kopijuoti ${agency.name} nuorodą`}>{copiedSlug === agency.unique_slug ? <Check size={18} /> : <Copy size={18} />}</button><Link href={`/admin/agencies/${agency.id}/edit`} className="proof-icon" title="Redaguoti" aria-label={`Redaguoti ${agency.name}`}><Edit size={18} /></Link><button onClick={() => handleDeleteAgency(agency.id)} className="proof-icon proof-danger" title="Ištrinti" aria-label={`Ištrinti ${agency.name}`}><Trash2 size={18} /></button></div></div>)}
        {normalizedSearchTerm && filteredClients.map(client => <div key={client.id} className="proof-row"><Link className="proof-entry" href={`/admin/clients/${client.id}`}><span className="proof-folder"><Folder size={25} /></span><div><h2>{client.name}</h2><p>{getAgencyName(client)} · Kliento katalogas</p></div><ChevronRight size={20} /></Link></div>)}
      </div>
      {!visibleAgencies.length && (!normalizedSearchTerm || !filteredClients.length) && <div className="proof-empty"><Folder size={34} /><h2>{normalizedSearchTerm ? 'Rezultatų nerasta' : 'Dar nėra agentūrų'}</h2><p>{normalizedSearchTerm ? 'Pabandykite kitą pavadinimą.' : 'Pridėkite pirmą agentūrą viršuje esančiu mygtuku.'}</p></div>}
    </div>
  )
}
