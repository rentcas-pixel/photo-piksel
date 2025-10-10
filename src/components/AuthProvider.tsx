'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Jei nėra sesijos, patikrinti localStorage
        if (!session) {
          const mockUser = localStorage.getItem('mock-user')
          if (mockUser) {
            setUser(JSON.parse(mockUser))
          } else {
            setUser(null)
          }
        } else {
          setUser(session.user)
        }
      } catch (error) {
        // Check localStorage for mock user
        const mockUser = localStorage.getItem('mock-user')
        if (mockUser) {
          setUser(JSON.parse(mockUser))
        } else {
          setUser(null)
        }
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      return () => subscription.unsubscribe()
    } catch (error) {
      console.log('Mock mode - no auth state listener')
      setLoading(false)
    }
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      // Mock mode - just clear localStorage
      localStorage.removeItem('mock-user')
    }
    setUser(null)
  }

  const value = {
    user,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
