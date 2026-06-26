import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { anime } from './anime'

export const character = pgTable('character', {
  id: uuid('id').primaryKey().defaultRandom(),
  animeId: uuid('anime_id').notNull().references(() => anime.id, { onDelete: 'cascade' }),
  nameRomaji: text('name_romaji').notNull(),
  nameKanji: text('name_kanji'),
  roleType: text('role_type'), // main | supporting
  source: text('source').unique(),
})
