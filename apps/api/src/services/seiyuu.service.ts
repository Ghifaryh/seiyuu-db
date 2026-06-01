import { db } from '../db/client'
import { seiyuu, seiyuuEnrichment, voiceRole, character, anime } from '../db/schema'
import { eq, ilike, or, sql } from 'drizzle-orm'

// get all seiyuu — paginated
export async function getAllSeiyuu(page = 1, limit = 24) {
  const offset = (page - 1) * limit

  const results = await db
    .select()
    .from(seiyuu)
    .limit(limit)
    .offset(offset)
    .orderBy(seiyuu.nameRomaji)

  const countResult = await db
    .select({ count: sql<string>`count(*)` })
    .from(seiyuu)

  const total = Number(countResult[0]?.count ?? 0)

  return {
    data: results,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}

// get one seiyuu by id — merged with enrichment
export async function getSeiyuuById(id: string) {
  const [result] = await db
    .select()
    .from(seiyuu)
    .leftJoin(seiyuuEnrichment, eq(seiyuu.id, seiyuuEnrichment.seiyuuId))
    .where(eq(seiyuu.id, id))

  return result ?? null
}

// get roles for a seiyuu — with optional season filter
export async function getSeiyuuRoles(
  seiyuuId: string,
  seasonYear?: number,
  seasonQuarter?: string,
  roleType?: string
) {
  const query = db
    .select({
      roleId: voiceRole.id,
      roleType: voiceRole.roleType,
      language: voiceRole.language,
      character: {
        id: character.id,
        nameRomaji: character.nameRomaji,
        nameKanji: character.nameKanji,
      },
      anime: {
        id: anime.id,
        titleRomaji: anime.titleRomaji,
        titleNative: anime.titleNative,
        seasonYear: anime.seasonYear,
        seasonQuarter: anime.seasonQuarter,
        studio: anime.studio,
        coverUrl: anime.coverUrl,
      }
    })
    .from(voiceRole)
    .innerJoin(character, eq(voiceRole.characterId, character.id))
    .innerJoin(anime, eq(voiceRole.animeId, anime.id))
    .where(eq(voiceRole.seiyuuId, seiyuuId))

  const results = await query

  // filter by season if provided
  return results.filter(r => {
    if (seasonYear && r.anime.seasonYear !== seasonYear) return false
    if (seasonQuarter && r.anime.seasonQuarter !== seasonQuarter) return false
    if (roleType && r.roleType !== roleType) return false
    return true
  })
}
