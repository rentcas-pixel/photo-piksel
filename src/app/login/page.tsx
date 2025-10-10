'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/auth-utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Store user in localStorage for mock mode
        if (data.user) {
          localStorage.setItem('mock-user', JSON.stringify(data.user))
        }
        
        // Redirect admin users to admin panel, others to clients list
        if (isAdmin(data.user?.email)) {
          router.push('/admin')
        } else {
          router.push('/dashboard/clients')
        }
      }
    } catch (err) {
      setError('Įvyko klaida prisijungiant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form (30%) */}
      <div className="w-full lg:w-[30%] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center mb-8">
              <img
                src="/Piksel-logo-black-2023.png"
                alt="Piksel"
                className="h-16 w-auto"
              />
            </div>
          </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 max-w-xs mx-auto">
            <div>
              <label htmlFor="email" className="sr-only">
                El. paštas
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
                placeholder="El. paštas"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Slaptažodis
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
                placeholder="Slaptažodis"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="max-w-xs mx-auto">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Prisijungiama...' : 'Prisijungti'}
            </button>
          </div>
        </form>
        </div>
      </div>

      {/* Right side - Image (70%) */}
      <div className="hidden lg:flex lg:w-[70%] relative">
        <img
          src="/Foto.jpg"
          alt="Piksel Photo Proof"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
