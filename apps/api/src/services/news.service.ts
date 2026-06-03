import { db } from '../db/client'
import { newsPost } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

export async function getNews(category?: string, limit = 20) {
  const query = db
    .select()
    .from(newsPost)
    .orderBy(desc(newsPost.publishedAt))
    .limit(limit)

  const results = category
    ? await db.select().from(newsPost)
      .where(eq(newsPost.category, category))
      .orderBy(desc(newsPost.publishedAt))
      .limit(limit)
    : await query

  return results
}

export async function createNewsPost(data: {
  title: string
  body: string
  category?: string
  seiyuuId?: string
  createdBy: string
}) {
  const [result] = await db
    .insert(newsPost)
    .values(data)
    .returning()

  return result
}

export async function deleteNewsPost(id: string) {
  const [result] = await db
    .delete(newsPost)
    .where(eq(newsPost.id, id))
    .returning()

  return result ?? null
}
