// convert AniList season string to our format
export function normaliseSeason(season: string): string {
  const map: Record<string, string> = {
    WINTER: 'winter',
    SPRING: 'spring',
    SUMMER: 'summer',
    FALL: 'fall'
  }
  return map[season?.toUpperCase()] ?? 'winter'
}

// normalise name — "Kayano, Ai" → "Ai Kayano"
export function normaliseRomajiName(name: string): string {
  if (!name) return ''
  // AniList sometimes returns "Last, First" format
  if (name.includes(',')) {
    const [last, first] = name.split(',').map(s => s.trim())
    return `${first} ${last}`
  }
  return name.trim()
}

// build aliases array from AniList name data
export function buildAliases(nameData: {
  full?: string
  native?: string
  alternative?: string[]
}): string[] {
  const aliases: string[] = []

  if (nameData.full) {
    const normalised = normaliseRomajiName(nameData.full)
    aliases.push(normalised)

    // add reversed version e.g. "Ai Kayano" → "Kayano Ai"
    const parts = normalised.split(' ')
    if (parts.length === 2) {
      aliases.push(`${parts[1]} ${parts[0]}`)
    }
  }

  if (nameData.native) aliases.push(nameData.native)

  if (nameData.alternative) {
    aliases.push(...nameData.alternative.filter(Boolean))
  }

  // deduplicate
  return [...new Set(aliases)]
}

// format birthdate from AniList object
export function formatBirthdate(dob: {
  year?: number
  month?: number
  day?: number
} | null): string | null {
  if (!dob || !dob.year || !dob.month || !dob.day) return null
  const mm = String(dob.month).padStart(2, '0')
  const dd = String(dob.day).padStart(2, '0')
  return `${dob.year}-${mm}-${dd}`
}
