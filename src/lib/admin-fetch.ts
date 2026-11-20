import { supabase } from '@/lib/supabase'

export async function adminApiRequest<T = unknown>(
  url: string,
  init: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session?.access_token) {
    return { ok: false, error: 'Sesija pasibaigė. Prisijunkite iš naujo.' }
  }

  const send = (token: string) => {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${token}`)
    return fetch(url, { ...init, headers })
  }

  let res = await send(session.access_token)
  if (res.status === 401) {
    // The API rejects authentication before any write. Retry only this case,
    // once, after Supabase has issued a fresh access token.
    const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshed?.access_token) {
      return { ok: false, error: 'Sesija pasibaigė. Prisijunkite iš naujo.' }
    }
    res = await send(refreshed.access_token)
  }

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
