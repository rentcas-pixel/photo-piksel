// Browser-local unread state. Opening a gallery does not mark every photo read.
function read(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Storage may be unavailable. */ }
}
export function isPhotoNew(clientId: string, campaignId: string, photo: { id: string; created_at: string }): boolean {
  const key = `last_visits_${clientId}`
  const stored = read(key)
  const visits: Record<string, string> = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored as Record<string, string> : {}
  if (!visits[campaignId] || !Number.isFinite(Date.parse(visits[campaignId]))) {
    visits[campaignId] = new Date().toISOString()
    write(key, visits)
  }
  const viewed = read(`viewed_photos_${clientId}_${campaignId}`)
  return Date.parse(photo.created_at) > Date.parse(visits[campaignId]) && !(Array.isArray(viewed) && viewed.includes(photo.id))
}
export function markPhotosViewed(clientId: string, campaignId: string, ids: string[]) {
  const key = `viewed_photos_${clientId}_${campaignId}`
  const stored = read(key)
  const viewed = Array.isArray(stored) ? stored.filter(item => typeof item === 'string') : []
  write(key, [...new Set([...viewed, ...ids])])
}
