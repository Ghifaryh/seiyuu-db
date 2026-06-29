import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { seiyuu } from './seiyuu'

export const gameRole = pgTable('game_role', {
  id: uuid('id').primaryKey().defaultRandom(),
  seiyuuId: uuid('seiyuu_id').notNull().references(() => seiyuu.id, { onDelete: 'cascade' }),
  gameTitle: text('game_title').notNull(),
  characterName: text('character_name').notNull(),
  roleType: text('role_type'), // main | supporting
  sourceUrl: text('source_url'),
  source: text('source').unique(),
})
