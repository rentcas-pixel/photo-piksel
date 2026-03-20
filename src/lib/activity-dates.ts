import type { Campaign, Client } from '@/types/database'

export function formatActivityPrimary(iso: string): string {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const days = diffMs / 86400000
  if (days < 7) {
    const diffSec = Math.round((d.getTime() - Date.now()) / 1000)
    const rtf = new Intl.RelativeTimeFormat('lt', { numeric: 'auto' })
    const abs = Math.abs(diffSec)
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
    return rtf.format(Math.round(diffSec / 86400), 'day')
  }
  return d.toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function clientActivityTime(
  client: Client,
  lastPhotoByClientId: Record<string, string>
): number {
  const times = [
    new Date(client.created_at).getTime(),
    new Date(client.updated_at).getTime(),
  ]
  const p = lastPhotoByClientId[client.id]
  if (p) times.push(new Date(p).getTime())
  return Math.max(...times)
}

export function clientActivityIso(
  client: Client,
  lastPhotoByClientId: Record<string, string>
): string {
  const candidates = [
    { iso: client.created_at, t: new Date(client.created_at).getTime() },
    { iso: client.updated_at, t: new Date(client.updated_at).getTime() },
  ]
  const p = lastPhotoByClientId[client.id]
  if (p) candidates.push({ iso: p, t: new Date(p).getTime() })
  return candidates.reduce((a, b) => (b.t > a.t ? b : a)).iso
}

export function campaignActivityTime(
  campaign: Campaign,
  lastPhotoByCampaignId: Record<string, string>
): number {
  const times = [
    new Date(campaign.created_at).getTime(),
    new Date(campaign.updated_at).getTime(),
  ]
  const p = lastPhotoByCampaignId[campaign.id]
  if (p) times.push(new Date(p).getTime())
  return Math.max(...times)
}

export function campaignActivityIso(
  campaign: Campaign,
  lastPhotoByCampaignId: Record<string, string>
): string {
  const candidates = [
    { iso: campaign.created_at, t: new Date(campaign.created_at).getTime() },
    { iso: campaign.updated_at, t: new Date(campaign.updated_at).getTime() },
  ]
  const p = lastPhotoByCampaignId[campaign.id]
  if (p) candidates.push({ iso: p, t: new Date(p).getTime() })
  return candidates.reduce((a, b) => (b.t > a.t ? b : a)).iso
}
