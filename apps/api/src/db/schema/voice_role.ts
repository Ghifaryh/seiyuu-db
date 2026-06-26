import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { seiyuu } from './seiyuu'
import { character } from './character'
import { anime } from './anime'

export const voiceRole = pgTable('voice_role', {
  id: uuid('id').primaryKey().defaultRandom(),
  seiyuuId: uuid('seiyuu_id').notNull().references(() => seiyuu.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').notNull().references(() => character.id, { onDelete: 'cascade' }),
  animeId: uuid('anime_id').notNull().references(() => anime.id, { onDelete: 'cascade' }),
  roleType: text('role_type'), // main | supporting
  language: text('language').default('Japanese'),
  source: text('source').unique(),
})
