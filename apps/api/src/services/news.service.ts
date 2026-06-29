import { db } from '../db/client'
import { newsPost, seiyuu, newsSeiyuu } from '../db/schema'
import { eq, desc, sql, and, inArray } from 'drizzle-orm'

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
    .leftJoin(newsSeiyuu, eq(newsPost.id, newsSeiyuu.newsId))
    .leftJoin(seiyuu, eq(newsSeiyuu.seiyuuId, seiyuu.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(newsPost.publishedAt))
    .limit(limit)

  // group by news post, collecting seiyuus
  const grouped: Record<string, any> = {}
  for (const r of results) {
    const nid = r.news.id
    if (!grouped[nid]) {
      grouped[nid] = { ...r.news, seiyuus: [] }
    }
    if (r.seiyuu?.id) {
      grouped[nid].seiyuus.push(r.seiyuu)
    }
  }

  // count total
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(newsPost)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
  const total = Number(countResult?.count ?? 0)

  return { data: Object.values(grouped), total }
}

export async function getNewsById(id: string) {
  const results = await db
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
    .leftJoin(newsSeiyuu, eq(newsPost.id, newsSeiyuu.newsId))
    .leftJoin(seiyuu, eq(newsSeiyuu.seiyuuId, seiyuu.id))
    .where(eq(newsPost.id, id))

  if (results.length === 0) return null

  const seiyuus = results.filter(r => r.seiyuu?.id).map(r => r.seiyuu)
  return {
    ...results[0].news,
    seiyuus,
  }
}

export async function createNewsPost(data: {
  title: string
  body?: string
  category?: string
  seiyuuIds?: string[]
  sourceUrl?: string
  createdBy: string
}) {
  const { seiyuuIds, ...postData } = data
  const [result] = await db
    .insert(newsPost)
    .values(postData)
    .returning()

  if (seiyuuIds?.length) {
    for (const sid of seiyuuIds) {
      await db.insert(newsSeiyuu).values({ newsId: result.id, seiyuuId: sid })
    }
  }

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
  seiyuuIds?: string[] | null
  sourceUrl?: string | null
}) {
  const { seiyuuIds, ...postData } = data
  const [result] = await db
    .update(newsPost)
    .set(postData)
    .where(eq(newsPost.id, id))
    .returning()

  if (seiyuuIds !== undefined) {
    // replace all seiyuu links
    await db.delete(newsSeiyuu).where(eq(newsSeiyuu.newsId, id))
    if (seiyuuIds) {
      for (const sid of seiyuuIds) {
        await db.insert(newsSeiyuu).values({ newsId: id, seiyuuId: sid })
      }
    }
  }

  return result ?? null
}
