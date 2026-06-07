import { Meilisearch } from 'meilisearch'

export const meili = new Meilisearch({
  host: process.env.MEILI_URL ?? 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY ?? 'dev_master_key'
})

export async function setupMeiliIndexes() {
  // create seiyuu index if not exists
  await meili.createIndex('seiyuu', { primaryKey: 'id' })

  const index = meili.index('seiyuu')

  // configure searchable fields + ranking
  await index.updateSettings({
    searchableAttributes: [
      'nameRomaji',
      'nameKanji',
      'nameAliases',
      'agency'
    ],
    filterableAttributes: [
      'isActive',
      'isSinger',
      'agency'
    ],
    sortableAttributes: [
      'nameRomaji'
    ],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 4,
        twoTypos: 8
      }
    }
  })

  console.log('✅ MeiliSearch indexes configured')
}
