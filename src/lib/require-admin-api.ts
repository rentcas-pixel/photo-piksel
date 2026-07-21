import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin'
import { createSupabaseAdmin } from '@/lib/supabase-admin-server'

type AdminOk = {
  ok: true
  user: User
  admin: SupabaseClient
}

type AdminFail = {
  ok: false
  response: NextResponse
}

/** Bearer token + admin el. paštas + service-role klientas. */
export async function requireAdminApi(
  request: NextRequest
): Promise<AdminOk | AdminFail> {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Nėra sesijos. Prisijunkite iš naujo.' },
        { status: 401 }
      ),
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            'Trūksta NEXT_PUBLIC_SUPABASE_URL arba NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        },
        { status: 500 }
      ),
    }
  }

  const admin = createSupabaseAdmin()
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            'Trūksta SUPABASE_SERVICE_ROLE_KEY Vercel Environment Variables.',
        },
        { status: 500 }
      ),
    }
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user?.email || !isAdminEmail(user.email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Neturite teisės.' },
        { status: 403 }
      ),
    }
  }

  return { ok: true, user, admin }
}
