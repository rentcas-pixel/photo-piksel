import { createClient } from '@supabase/supabase-js'

function isNewStyleApiKey(key: string): boolean {
  return key.startsWith('sb_secret_') || key.startsWith('sb_publishable_')
}

/** Server-only Supabase klientas (service role / secret key) — apeina RLS. */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key || key === 'placeholder-service-key') {
    return null
  }

  const newStyleKey = isNewStyleApiKey(key)

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: newStyleKey
      ? {
          fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const headers = new Headers(init?.headers)
            headers.set('apikey', key)
            // sb_secret_ is not a JWT. Sending it as Bearer makes PostgREST
            // return "Invalid JWT" and DELETE/UPDATE fail while public SELECT still works.
            if (headers.get('Authorization') === `Bearer ${key}`) {
              headers.delete('Authorization')
            }
            return fetch(input, { ...init, headers })
          },
        }
      : {},
  })
}
