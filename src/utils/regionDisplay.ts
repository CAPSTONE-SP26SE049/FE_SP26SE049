/**
 * Chuẩn hóa hiển thị vùng miền: BAC, NAM, south, north, "Miền nam", … → "Miền Bắc" | "Miền Trung" | "Miền Nam".
 */

const BY_CODE: Record<string, string> = {
  BAC: 'Miền Bắc',
  TRUNG: 'Miền Trung',
  NAM: 'Miền Nam',
  NORTH: 'Miền Bắc',
  CENTRAL: 'Miền Trung',
  SOUTH: 'Miền Nam',
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Trả về mã BAC | TRUNG | NAM nếu nhận diện được; ngược lại null. */
export function normalizeRegionCode(regionKey: string | undefined | null): 'BAC' | 'TRUNG' | 'NAM' | null {
  if (regionKey == null || String(regionKey).trim() === '') return null
  const raw = String(regionKey).trim()

  const upper = raw.toUpperCase()
  if (upper === 'BAC' || upper === 'NORTH') return 'BAC'
  if (upper === 'TRUNG' || upper === 'CENTRAL') return 'TRUNG'
  if (upper === 'NAM' || upper === 'SOUTH') return 'NAM'

  const mienPrefix = raw.match(/^Miền\s+(.+)$/i)
  if (mienPrefix) {
    const w = stripAccents(mienPrefix[1]).toLowerCase().trim()
    if (w === 'bac') return 'BAC'
    if (w === 'trung') return 'TRUNG'
    if (w === 'nam') return 'NAM'
  }

  const de = stripAccents(raw)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

  if (['bac', 'north', 'mien bac'].includes(de) || de.includes('mien bac')) return 'BAC'
  if (['trung', 'central', 'mien trung'].includes(de) || de.includes('mien trung')) return 'TRUNG'
  if (de === 'nam' || de === 'south' || de === 'mien nam' || de.includes('mien nam')) return 'NAM'

  if (de.includes('north')) return 'BAC'
  if (de.includes('central')) return 'TRUNG'
  if (de.includes('south')) return 'NAM'

  return null
}

/** Nhãn hiển thị thống nhất dạng "Miền …". */
export function getRegionLabel(regionKey: string | undefined | null): string {
  if (regionKey == null || String(regionKey).trim() === '') return '—'
  const code = normalizeRegionCode(regionKey)
  if (code) return BY_CODE[code]
  return String(regionKey).trim()
}
