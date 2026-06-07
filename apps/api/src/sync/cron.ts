import { syncSeason } from './runner'
import { setupMeiliIndexes } from '../lib/meili'

// run on startup
export async function runStartupSync() {
  await setupMeiliIndexes()

  // sync current season on startup
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  let quarter: string
  if (month >= 1 && month <= 3) quarter = 'winter'
  else if (month >= 4 && month <= 6) quarter = 'spring'
  else if (month >= 7 && month <= 9) quarter = 'summer'
  else quarter = 'fall'

  await syncSeason(year, quarter)
}

// schedule nightly sync at 2am
export function scheduleCron() {
  Bun.cron('0 2 * * *', async () => {
    console.log('🕐 Nightly sync starting...')
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    let quarter: string
    if (month >= 1 && month <= 3) quarter = 'winter'
    else if (month >= 4 && month <= 6) quarter = 'spring'
    else if (month >= 7 && month <= 9) quarter = 'summer'
    else quarter = 'fall'

    await syncSeason(year, quarter)
  })

  console.log('⏰ Nightly sync scheduled at 2am')
}
