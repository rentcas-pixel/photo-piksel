import { supabase } from '@/lib/supabase'

export type ResolvedShareCampaign = {
  campaignId: string
  clientId: string
  slug: string
  name: string
  updatedAt: string
}

export function isValidShareCode(code: string): boolean {
  const trimmed = code?.trim()
  return !!trimmed && trimmed.length <= 24 && /^[a-zA-Z0-9]+$/.test(trimmed)
}

export async function resolveShareCode(
  code: string
): Promise<ResolvedShareCampaign | null> {
  const trimmed = code.trim()
  if (!isValidShareCode(trimmed)) return null

  const { data, error } = await supabase
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

export async function getCampaignPhotoStats(campaignId: string): Promise<{
  count: number
  latestUploadedAt: string | null
}> {
  const { data: photos } = await supabase
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

export function formatUploadedDate(
  iso: string | null | undefined,
  fallback?: string
): string {
  const raw = iso || fallback
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toISOString().slice(0, 10)
}
