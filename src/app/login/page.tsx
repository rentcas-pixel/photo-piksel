'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted, email:', email)
    setLoading(true)
    setError('')

    try {
      console.log('Attempting to sign in...')
      console.log('Supabase client:', supabase ? 'exists' : 'missing')
      console.log('Email:', email)
      console.log('Password length:', password.length)
      
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in promise created, waiting for response...')
      
      const { data, error } = await signInPromise

      console.log('Sign in response received!')
      console.log('Data:', data)
      console.log('Error:', error)

      if (error) {
        console.error('Login error:', error)
        // More specific error messages
        if (error.message.includes('Invalid login credentials')) {
          setError('Neteisingas el. paštas arba slaptažodis')
        } else if (error.message.includes('Email not confirmed')) {
          setError('El. paštas nepatvirtintas. Patikrinkite savo el. paštą arba susisiekite su administratoriumi.')
        } else {
          setError(error.message || 'Klaida prisijungiant')
        }
        setLoading(false)
        return
      }

      if (!data || !data.user) {
        console.error('No user data returned')
        setError('Nepavyko gauti vartotojo duomenų')
        setLoading(false)
        return
      }

      // Store user in localStorage
      console.log('Storing user in localStorage:', data.user.email)
      localStorage.setItem('mock-user', JSON.stringify(data.user))
      
      // Redirect admin users to admin panel
      const adminEmails = ['admin@piksel.lt', 'renatas@piksel.lt']
      console.log('Checking if user is admin. Email:', data.user.email, 'Admin emails:', adminEmails)
      
      if (data.user.email && adminEmails.includes(data.user.email)) {
        console.log('User is admin, redirecting to /admin')
        // Use window.location for more reliable redirect
        window.location.href = '/admin'
      } else {
        console.log('User is not admin, showing error')
        setError('Jūs neturite administratoriaus teisių')
        setLoading(false)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Įvyko klaida prisijungiant: ' + (err instanceof Error ? err.message : 'Nežinoma klaida'))
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
