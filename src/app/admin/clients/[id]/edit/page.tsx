'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Agency } from '@/types/database'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agency_id: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (clientId) {
      fetchClient()
      fetchAgencies()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) {
        console.error('Error fetching client:', error)
        router.push('/admin')
      } else {
        setFormData({
          name: data.name,
          description: data.description || '',
          agency_id: data.agency_id
        })
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  const fetchAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching agencies:', error)
      } else {
        setAgencies(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          description: formData.description,
          agency_id: formData.agency_id,
        })
        .eq('id', clientId)

      if (updateError) {
        setError('Klaida redaguojant klientą: ' + updateError.message)
      } else {
        alert('Klientas sėkmingai atnaujintas!')
        router.push('/admin')
      }
    } catch (err) {
      setError('Įvyko nenumatyta klaida')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Grįžti į dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Redaguoti klientą</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="agency_id" className="block text-sm font-medium text-gray-700 mb-2">
              Agentūra *
            </label>
            <select
              id="agency_id"
              name="agency_id"
              required
              value={formData.agency_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Pasirinkite agentūrą...</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Kliento pavadinimas *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Pvz., IF Draudimas"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Aprašymas
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Trumpas aprašymas apie klientą..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving || !formData.agency_id}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Išsaugoma...' : 'Išsaugoti pakeitimus'}
            </button>
            <Link
              href="/admin"
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
            >
              Atšaukti
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
