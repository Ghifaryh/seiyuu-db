const CLIENT_API_BASE = '/api/v1'
const SERVER_API_BASE = `${process.env.API_URL || 'http://localhost:3001'}/api/v1`

export { CLIENT_API_BASE, SERVER_API_BASE as API_BASE }

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatSeason(year: number | null, quarter: string | null): string {
  if (!year || !quarter) return 'Unknown'
  const q = quarter.charAt(0).toUpperCase() + quarter.slice(1)
  return `${q} ${year}`
}

export async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${SERVER_API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}
