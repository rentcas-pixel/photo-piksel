/**
 * Supabase Storage object keys must be flat paths without invalid characters.
 * Folder uploads can set file.name to "Client/Campaign/photo.jpg" — sanitize before upload.
 */
export function safeStorageFileName(originalName: string): string {
  const base = originalName.split(/[/\\]/).pop() || 'photo'
  const lastDot = base.lastIndexOf('.')
  const ext = lastDot > 0 ? base.slice(lastDot) : ''
  const stem = lastDot > 0 ? base.slice(0, lastDot) : base

  const safeStem =
    stem
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100) || 'photo'

  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 12)

  return `${Date.now()}-${safeStem}${safeExt}`
}

/** Storage object key from DB filename or public URL (legacy rows stored full URLs). */
export function storageObjectKey(
  filename: string | null | undefined,
  url?: string | null
): string | null {
  const fromName = (filename || '').trim()
  if (fromName && !/^https?:\/\//i.test(fromName)) {
    return fromName.replace(/^\/+/, '')
  }

  const source = /^https?:\/\//i.test(fromName) ? fromName : url || ''
  if (!source) return fromName || null

  try {
    const parsed = new URL(source)
    const markers = [
      '/storage/v1/object/public/photos/',
      '/storage/v1/object/sign/photos/',
      '/storage/v1/object/photos/',
    ]
    for (const marker of markers) {
      const idx = parsed.pathname.indexOf(marker)
      if (idx !== -1) {
        return decodeURIComponent(parsed.pathname.slice(idx + marker.length))
      }
    }
  } catch {
    // ignore malformed URLs
  }

  return fromName || null
}
