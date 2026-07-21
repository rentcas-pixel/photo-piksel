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
