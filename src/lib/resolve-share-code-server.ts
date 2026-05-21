import { createSupabaseAdmin } from '@/lib/supabase-admin-server'
import type { ResolvedShareCampaign } from '@/lib/resolve-share-code'
import { isValidShareCode } from '@/lib/resolve-share-code'

export async function resolveShareCodeServer(
  code: string
): Promise<ResolvedShareCampaign | null> {
  const trimmed = code.trim()
  if (!isValidShareCode(trimmed)) return null

  const admin = createSupabaseAdmin()
  if (!admin) return null

  const { data, error } = await admin
    .from('campaigns')
    .select(
      `
      id,
      name,
      updated_at,
      client_id,
      clients (
        agencies ( unique_slug )
      )
    `
    )
    .eq('share_code', trimmed)
    .maybeSingle()

  if (error || !data) return null

  const row = data as {
    id: string
    name: string
    updated_at: string
    client_id: string
    clients:
      | { agencies: { unique_slug: string } | { unique_slug: string }[] | null }
      | { agencies: { unique_slug: string } | { unique_slug: string }[] | null }[]
      | null
  }

  const clientNode = Array.isArray(row.clients) ? row.clients[0] : row.clients
  const agencyNode = clientNode?.agencies
  const slug = Array.isArray(agencyNode)
    ? agencyNode[0]?.unique_slug
    : agencyNode?.unique_slug

  if (!slug || !row.client_id || !row.id) return null

  return {
    campaignId: row.id,
    clientId: row.client_id,
    slug,
    name: row.name,
    updatedAt: row.updated_at,
  }
}

export async function getCampaignPhotoStatsServer(campaignId: string): Promise<{
  count: number
  latestUploadedAt: string | null
}> {
  const admin = createSupabaseAdmin()
  if (!admin) return { count: 0, latestUploadedAt: null }

  const { data: photos } = await admin
    .from('photos')
    .select('created_at')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  const list = photos || []
  return {
    count: list.length,
    latestUploadedAt: list[0]?.created_at ?? null,
  }
}
