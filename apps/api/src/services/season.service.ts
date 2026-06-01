import { db } from '../db/client'
import { anime, voiceRole, character, seiyuu } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function getSeasonAnime(year: number, quarter: string) {
  const results = await db
    .select()
    .from(anime)
    .where(
      and(
        eq(anime.seasonYear, year),
        eq(anime.seasonQuarter, quarter)
      )
    )
    .orderBy(anime.titleRomaji)

  return results
}

export async function getSeasonAnimeCast(year: number, quarter: string) {
  const results = await db
    .select({
      anime: {
        id: anime.id,
        titleRomaji: anime.titleRomaji,
        titleNative: anime.titleNative,
        studio: anime.studio,
        coverUrl: anime.coverUrl,
        status: anime.status,
      },
      character: {
        id: character.id,
        nameRomaji: character.nameRomaji,
        nameKanji: character.nameKanji,
        roleType: character.roleType,
      },
      seiyuu: {
        id: seiyuu.id,
        nameRomaji: seiyuu.nameRomaji,
        nameKanji: seiyuu.nameKanji,
        imageUrl: seiyuu.imageUrl,
      },
      roleType: voiceRole.roleType,
    })
    .from(anime)
    .innerJoin(voiceRole, eq(anime.id, voiceRole.animeId))
    .innerJoin(character, eq(voiceRole.characterId, character.id))
    .innerJoin(seiyuu, eq(voiceRole.seiyuuId, seiyuu.id))
    .where(
      and(
        eq(anime.seasonYear, year),
        eq(anime.seasonQuarter, quarter)
      )
    )

  // group by anime
  const grouped = results.reduce((acc, row) => {
    const animeId = row.anime.id
    if (!acc[animeId]) {
      acc[animeId] = {
        ...row.anime,
        cast: []
      }
    }
    acc[animeId].cast.push({
      character: row.character,
      seiyuu: row.seiyuu,
      roleType: row.roleType
    })
    return acc
  }, {} as Record<string, any>)

  return Object.values(grouped)
}

export async function getSeasonSeiyuu(year: number, quarter: string) {
  const results = await db
    .select({
      seiyuu: {
        id: seiyuu.id,
        nameRomaji: seiyuu.nameRomaji,
        nameKanji: seiyuu.nameKanji,
        imageUrl: seiyuu.imageUrl,
      },
      roleCount: sql<string>`count(${voiceRole.id})`
    })
    .from(seiyuu)
    .innerJoin(voiceRole, eq(seiyuu.id, voiceRole.seiyuuId))
    .innerJoin(anime, eq(voiceRole.animeId, anime.id))
    .where(
      and(
        eq(anime.seasonYear, year),
        eq(anime.seasonQuarter, quarter)
      )
    )
    .groupBy(
      seiyuu.id,
      seiyuu.nameRomaji,
      seiyuu.nameKanji,
      seiyuu.imageUrl
    )
    .orderBy(sql`count(${voiceRole.id}) desc`)

  return results.map(r => ({
    ...r.seiyuu,
    roleCount: Number(r.roleCount)
  }))
}

// helper to resolve current season
export function getCurrentSeason(): { year: number, quarter: string } {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  let quarter: string
  if (month >= 1 && month <= 3) quarter = 'winter'
  else if (month >= 4 && month <= 6) quarter = 'spring'
  else if (month >= 7 && month <= 9) quarter = 'summer'
  else quarter = 'fall'

  return { year, quarter }
}
