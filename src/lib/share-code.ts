import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Be 0/O/1/l — patogiai skaitoma URL */
const ALPHABET =
  '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'

export function generateShareCode(length = 10): string {
  const bytes = randomBytes(length)
  let s = ''
  for (let i = 0; i < length; i++) {
    s += ALPHABET[bytes[i]! % ALPHABET.length]!
  }
  return s
}

/** Sugeneruoja unikalų kodą (tikrina `campaigns.share_code`). */
export async function allocateUniqueShareCode(
  admin: SupabaseClient
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateShareCode(10)
    const { data } = await admin
      .from('campaigns')
      .select('id')
      .eq('share_code', code)
      .maybeSingle()
    if (!data) return code
  }
  throw new Error('Nepavyko sugeneruoti unikalaus trumpo kodo')
}
