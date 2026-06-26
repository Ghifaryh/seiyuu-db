import { db } from '../db/client'
import { seiyuu, seiyuuEnrichment, voiceRole, character, anime } from '../db/schema'
import { eq, ilike, or, sql } from 'drizzle-orm'
import { enrichSeiyuuCareer } from './seiyuu-enrichment.service'

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

  if (!result) return null

  // trigger enrichment in background if not done yet
  if (!result.seiyuu.enriched && result.seiyuu.source?.startsWith('anilist:')) {
    enrichSeiyuuCareer(result.seiyuu.id).catch(err =>
      console.error(`Enrichment failed for ${result.seiyuu.nameRomaji}:`, err)
    )
  }

  return result
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

export async function updateSeiyuu(id: string, data: {
  agency?: string | null
  isActive?: boolean
  isSinger?: boolean
  biography?: string | null
  musicSingles?: string[] | null
  musicAlbums?: string[] | null
  adminNotes?: string | null
}) {
  const { agency, isActive, isSinger, biography, musicSingles, musicAlbums, adminNotes } = data

  // update seiyuu core fields
  if (agency !== undefined || isActive !== undefined || isSinger !== undefined) {
    const updateData: any = {}
    if (agency !== undefined) updateData.agency = agency
    if (isActive !== undefined) updateData.isActive = isActive
    if (isSinger !== undefined) updateData.isSinger = isSinger
    await db.update(seiyuu).set(updateData).where(eq(seiyuu.id, id))
  }

  // update or insert enrichment
  const enrichmentData: any = {}
  if (biography !== undefined) enrichmentData.biography = biography
  if (musicSingles !== undefined) enrichmentData.musicSingles = musicSingles
  if (musicAlbums !== undefined) enrichmentData.musicAlbums = musicAlbums
  if (adminNotes !== undefined) enrichmentData.adminNotes = adminNotes

  if (Object.keys(enrichmentData).length > 0) {
    const [existing] = await db
      .select({ id: seiyuuEnrichment.id })
      .from(seiyuuEnrichment)
      .where(eq(seiyuuEnrichment.seiyuuId, id))

    if (existing) {
      enrichmentData.updatedAt = new Date()
      await db.update(seiyuuEnrichment).set(enrichmentData).where(eq(seiyuuEnrichment.seiyuuId, id))
    } else {
      await db.insert(seiyuuEnrichment).values({
        seiyuuId: id,
        ...enrichmentData,
        updatedAt: new Date(),
      })
    }
  }

  // return updated profile
  return getSeiyuuById(id)
}
