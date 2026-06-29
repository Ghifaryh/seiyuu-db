import { pgTable, uuid } from 'drizzle-orm/pg-core'
import { newsPost } from './news'
import { seiyuu } from './seiyuu'

export const newsSeiyuu = pgTable('news_seiyuu', {
  id: uuid('id').primaryKey().defaultRandom(),
  newsId: uuid('news_id').notNull().references(() => newsPost.id, { onDelete: 'cascade' }),
  seiyuuId: uuid('seiyuu_id').notNull().references(() => seiyuu.id, { onDelete: 'cascade' }),
})
