import { db } from '../db/client'
import { newsPost, seiyuu } from '../db/schema'
import { eq, desc, sql, and } from 'drizzle-orm'

export async function getNews(category?: string, limit = 20) {
  const conditions = category
    ? [eq(newsPost.category, category)]
    : []

  const results = await db
    .select({
      news: {
        id: newsPost.id,
        title: newsPost.title,
        body: newsPost.body,
        category: newsPost.category,
        sourceUrl: newsPost.sourceUrl,
        publishedAt: newsPost.publishedAt,
      },
      seiyuu: {
        id: seiyuu.id,
        nameRomaji: seiyuu.nameRomaji,
        nameKanji: seiyuu.nameKanji,
        imageUrl: seiyuu.imageUrl,
      }
    })
    .from(newsPost)
    .leftJoin(seiyuu, eq(newsPost.seiyuuId, seiyuu.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(newsPost.publishedAt))
    .limit(limit)

  // count total
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(newsPost)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
  const total = Number(countResult?.count ?? 0)

  return { data: results.map(r => ({ ...r.news, seiyuu: r.seiyuu ?? null })), total }
}

export async function getNewsById(id: string) {
  const [result] = await db
    .select({
      news: {
        id: newsPost.id,
        title: newsPost.title,
        body: newsPost.body,
        category: newsPost.category,
        sourceUrl: newsPost.sourceUrl,
        publishedAt: newsPost.publishedAt,
        createdBy: newsPost.createdBy,
      },
      seiyuu: {
        id: seiyuu.id,
        nameRomaji: seiyuu.nameRomaji,
        nameKanji: seiyuu.nameKanji,
        imageUrl: seiyuu.imageUrl,
      }
    })
    .from(newsPost)
    .leftJoin(seiyuu, eq(newsPost.seiyuuId, seiyuu.id))
    .where(eq(newsPost.id, id))

  if (!result) return null

  return {
    ...result.news,
    seiyuu: result.seiyuu ?? null,
  }
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

export async function updateNewsPost(id: string, data: {
  title?: string
  body?: string
  category?: string
  seiyuuId?: string | null
  sourceUrl?: string | null
}) {
  const [result] = await db
    .update(newsPost)
    .set(data)
    .where(eq(newsPost.id, id))
    .returning()

  return result ?? null
}
