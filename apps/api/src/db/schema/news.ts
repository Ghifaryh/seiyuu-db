import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { appUser } from './user'
import { seiyuu } from './seiyuu'

export const newsPost = pgTable('news_post', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  category: text('category'), // roles | agency
  seiyuuId: uuid('seiyuu_id').references(() => seiyuu.id),
  sourceUrl: text('source_url'),
  createdBy: uuid('created_by').references(() => appUser.id),
  publishedAt: timestamp('published_at').defaultNow()
})