import { supabase } from '@/lib/supabase'

export async function adminApiRequest<T = unknown>(
  url: string,
  init: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { ok: false, error: 'Sesija pasibaigė. Prisijunkite iš naujo.' }
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const json = isJson ? await res.json().catch(() => ({})) : {}

  if (!res.ok) {
    return {
      ok: false,
      error: (json as { error?: string }).error || `Klaida (${res.status})`,
    }
  }

  if (!isJson) {
    return {
      ok: false,
      error: 'Serveris nepatvirtino veiksmo. Perkraukite puslapį ir bandykite dar kartą.',
    }
  }

  return { ok: true, data: json as T }
}
