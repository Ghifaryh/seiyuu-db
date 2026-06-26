import { pgTable, uuid, text, boolean, date, timestamp } from 'drizzle-orm/pg-core'

export const seiyuu = pgTable('seiyuu', {
  id: uuid('id').primaryKey().defaultRandom(),
  nameRomaji: text('name_romaji').notNull(),
  nameKanji: text('name_kanji'),
  nameAliases: text('name_aliases').array(),
  birthdate: date('birthdate'),
  birthplace: text('birthplace'),
  agency: text('agency'),
  isSinger: boolean('is_singer').default(false),
  isActive: boolean('is_active').default(true),
  imageUrl: text('image_url'),
  source: text('source').unique(),
  enriched: boolean('enriched').default(false),
  syncedAt: timestamp('synced_at').defaultNow()
})

export const seiyuuEnrichment = pgTable('seiyuu_enrichment', {
  id: uuid('id').primaryKey().defaultRandom(),
  seiyuuId: uuid('seiyuu_id').notNull().references(() => seiyuu.id, { onDelete: 'cascade' }),
  biography: text('biography'),
  musicSingles: text('music_singles').array(),
  musicAlbums: text('music_albums').array(),
  adminNotes: text('admin_notes'),
  updatedAt: timestamp('updated_at').defaultNow()
})
