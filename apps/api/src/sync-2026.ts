import { setupMeiliIndexes } from './lib/meili'
import { syncSeason } from './sync/runner'

const QUARTERS = ['winter', 'spring', 'summer', 'fall'] as const

console.log('🔄 Syncing all 2026 quarters...\n')

await setupMeiliIndexes()

for (const quarter of QUARTERS) {
  console.log(`\n📺 === ${quarter.toUpperCase()} 2026 ===`)
  await syncSeason(2026, quarter)
}

console.log('\n✅ All 2026 quarters synced.')
process.exit(0)
