import { pgTable, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core'
import { seiyuu } from './seiyuu'
import { anime } from './anime'
import { character } from './character'

export const pairing = pgTable('pairing', {
  id: uuid('id').primaryKey().defaultRandom(),
  seiyuuAId: uuid('seiyuu_a_id').notNull().references(() => seiyuu.id),
  seiyuuBId: uuid('seiyuu_b_id').notNull().references(() => seiyuu.id),
  pairName: text('pair_name'),
  description: text('description'),
  isAutoDetected: boolean('is_auto_detected').default(true),
  sharedCount: integer('shared_count').default(0),
  createdAt: timestamp('created_at').defaultNow()
})

export const pairingAnime = pgTable('pairing_anime', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairingId: uuid('pairing_id').notNull().references(() => pairing.id, { onDelete: 'cascade' }),
  animeId: uuid('anime_id').notNull().references(() => anime.id),
  charAId: uuid('char_a_id').references(() => character.id),
  charBId: uuid('char_b_id').references(() => character.id)
})
