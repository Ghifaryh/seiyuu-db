export type Quarter = 'winter' | 'spring' | 'summer' | 'fall'

const QUARTER_ORDER: Quarter[] = ['winter', 'spring', 'summer', 'fall']

export interface SeasonInfo {
  year: number
  quarter: Quarter
}

// resolve today's date into a season
export function getCurrentSeason(): SeasonInfo {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  let quarter: Quarter
  if (month >= 1 && month <= 3) quarter = 'winter'
  else if (month >= 4 && month <= 6) quarter = 'spring'
  else if (month >= 7 && month <= 9) quarter = 'summer'
  else quarter = 'fall'

  return { year, quarter }
}

// move a season forward or backward by N steps (negative = backward)
export function shiftSeason(season: SeasonInfo, steps: number): SeasonInfo {
  const currentIndex = QUARTER_ORDER.indexOf(season.quarter)
  const totalIndex = season.year * 4 + currentIndex + steps

  const newYear = Math.floor(totalIndex / 4)
  const newQuarterIndex = ((totalIndex % 4) + 4) % 4

  return {
    year: newYear,
    quarter: QUARTER_ORDER[newQuarterIndex]
  }
}

/**
 * Dropdown rule: always show all 4 seasons of the given year.
 * EXCEPTION — if the given season is Winter, also prepend the previous
 * year's Fall, since Winter has no "earlier season this year" to anchor to.
 *
 * e.g. viewing Spring 2027 → [Winter 2027, Spring 2027, Summer 2027, Fall 2027]
 * e.g. viewing Winter 2027 → [Fall 2026, Winter 2027, Spring 2027, Summer 2027, Fall 2027]
 */
export function getSeasonOptions(current: SeasonInfo = getCurrentSeason()): SeasonInfo[] {
  const yearSeasons: SeasonInfo[] = QUARTER_ORDER.map(q => ({ year: current.year, quarter: q }))

  if (current.quarter === 'winter') {
    const previousFall = shiftSeason(current, -1) // always resolves to prior year's fall
    return [previousFall, ...yearSeasons]
  }

  return yearSeasons
}

export function formatSeasonLabel(season: SeasonInfo): string {
  const labels: Record<Quarter, string> = {
    winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall'
  }
  return `${labels[season.quarter]} ${season.year}`
}

export function seasonToValue(season: SeasonInfo): string {
  return `${season.year}-${season.quarter}`
}