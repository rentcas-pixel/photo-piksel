import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code: raw } = await context.params
  const code = raw?.trim()
  if (!code || code.length > 24 || !/^[a-zA-Z0-9]+$/.test(code)) {
    return new NextResponse('Nerasta', { status: 404 })
  }

  if (!supabaseUrl || !serviceKey) {
    return new NextResponse('Serverio klaida', { status: 500 })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await admin
    .from('campaigns')
    .select(
      `
      id,
      client_id,
      clients (
        agencies ( unique_slug )
      )
    `
    )
    .eq('share_code', code)
    .maybeSingle()

  if (error || !data) {
    return new NextResponse('Nerasta', { status: 404 })
  }

  const row = data as unknown as {
    id: string
    client_id: string
    clients:
      | {
          agencies:
            | { unique_slug: string }
            | { unique_slug: string }[]
            | null
        }
      | {
          agencies:
            | { unique_slug: string }
            | { unique_slug: string }[]
            | null
        }[]
      | null
  }

  const clientNode = Array.isArray(row.clients) ? row.clients[0] : row.clients
  const agencyNode = clientNode?.agencies
  const slug = Array.isArray(agencyNode)
    ? agencyNode[0]?.unique_slug
    : agencyNode?.unique_slug

  if (!slug || !row.client_id || !row.id) {
    return new NextResponse('Nerasta', { status: 404 })
  }

  const target = new URL(`/${slug}/${row.client_id}/${row.id}/cover`, request.url)
  return NextResponse.redirect(target, 302)
}
