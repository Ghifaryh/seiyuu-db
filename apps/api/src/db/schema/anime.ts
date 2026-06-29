import { pgTable, uuid, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'

export const anime = pgTable('anime', {
  id: uuid('id').primaryKey().defaultRandom(),
  titleRomaji: text('title_romaji').notNull(),
  titleNative: text('title_native'),
  seasonYear: integer('season_year'),
  seasonQuarter: text('season_quarter'),
  studio: text('studio'),
  status: text('status'),
  coverUrl: text('cover_url'),
  source: text('source').unique(),
  enriched: boolean('enriched').default(false),
  syncedAt: timestamp('synced_at').defaultNow()
})
