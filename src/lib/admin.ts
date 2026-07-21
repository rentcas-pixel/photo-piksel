/** El. paštai su pilnu admin prieiga (turi sutapti su Supabase RLS ir login logika) */
export const ADMIN_EMAILS = [
  'admin@piksel.lt',
  'renatas@piksel.lt',
  'romanas@piksel.lt',
  'paulina@piksel.lt',
] as const

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return (ADMIN_EMAILS as readonly string[]).includes(email)
}
