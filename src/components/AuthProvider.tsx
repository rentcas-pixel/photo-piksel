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

function clearLegacyUser() {
  try {
    localStorage.removeItem('mock-user')
  } catch {
    // A blocked browser storage must not turn an old user marker into a session.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    let active = true
    let authChanged = false
    clearLegacyUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        authChanged = true
        if (!active) return
        setUser(session?.access_token ? session.user : null)
        setLoading(false)
      }
    )

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (active && !authChanged) {
          setUser(!error && session?.access_token ? session.user : null)
        }
      } catch {
        if (active && !authChanged) {
          setUser(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void getInitialSession()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      clearLegacyUser()
      setUser(null)
    }
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
