import { db } from '../db/client'
import { seiyuu, seiyuuEnrichment, voiceRole, character, anime } from '../db/schema'
import { gameRole } from '../db/schema/game_role'
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
      source: voiceRole.source,
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

export async function addAnimeRole(seiyuuId: string, data: {
  animeId: string
  characterName: string
  roleType?: string
}) {
  // upsert character
  const [charRecord] = await db
    .insert(character)
    .values({
      animeId: data.animeId,
      nameRomaji: data.characterName,
      roleType: data.roleType || 'supporting',
      source: `manual:${data.animeId}:${data.characterName}`,
    })
    .onConflictDoUpdate({
      target: character.source,
      set: { nameRomaji: data.characterName, roleType: data.roleType || 'supporting' },
    })
    .returning()

  if (!charRecord) throw new Error('Failed to upsert character')

  const [result] = await db
    .insert(voiceRole)
    .values({
      seiyuuId,
      characterId: charRecord.id,
      animeId: data.animeId,
      roleType: data.roleType || 'supporting',
      language: 'Japanese',
      source: `manual:${data.animeId}:${data.characterName}:${seiyuuId}`,
    })
    .onConflictDoUpdate({
      target: voiceRole.source,
      set: { roleType: data.roleType || 'supporting' },
    })
    .returning()

  return result
}

export async function addGameRole(seiyuuId: string, data: {
  gameTitle: string
  characterName: string
  roleType?: string
  sourceUrl?: string | null
}) {
  const source = `manual:${data.gameTitle}:${data.characterName}:${seiyuuId}`
  const [result] = await db
    .insert(gameRole)
    .values({
      seiyuuId,
      gameTitle: data.gameTitle,
      characterName: data.characterName,
      roleType: data.roleType || 'supporting',
      sourceUrl: data.sourceUrl ?? undefined,
      source,
    })
    .onConflictDoUpdate({
      target: gameRole.source,
      set: { roleType: data.roleType || 'supporting', sourceUrl: data.sourceUrl ?? undefined },
    })
    .returning()

  return result
}

export async function deleteAnimeRole(roleId: string, seiyuuId: string) {
  const [role] = await db.select().from(voiceRole).where(eq(voiceRole.id, roleId))
  if (!role || role.seiyuuId !== seiyuuId) return null
  if (!role.source?.startsWith('manual:')) return null
  await db.delete(voiceRole).where(eq(voiceRole.id, roleId))
  return { deleted: true }
}

export async function deleteGameRole(roleId: string, seiyuuId: string) {
  const [role] = await db.select().from(gameRole).where(eq(gameRole.id, roleId))
  if (!role || role.seiyuuId !== seiyuuId) return null
  if (!role.source?.startsWith('manual:')) return null
  await db.delete(gameRole).where(eq(gameRole.id, roleId))
  return { deleted: true }
}

export async function updateAnimeRole(roleId: string, seiyuuId: string, data: {
  characterName?: string
  roleType?: string
}) {
  const [role] = await db.select().from(voiceRole).where(eq(voiceRole.id, roleId))
  if (!role || role.seiyuuId !== seiyuuId) return null

  // also update the character name
  if (data.characterName) {
    await db.update(character)
      .set({ nameRomaji: data.characterName })
      .where(eq(character.id, role.characterId))
  }
  if (data.roleType) {
    await db.update(voiceRole).set({ roleType: data.roleType }).where(eq(voiceRole.id, roleId))
  }
  return { updated: true }
}

export async function updateGameRole(roleId: string, seiyuuId: string, data: {
  gameTitle?: string
  characterName?: string
  roleType?: string
  sourceUrl?: string | null
}) {
  const [role] = await db.select().from(gameRole).where(eq(gameRole.id, roleId))
  if (!role || role.seiyuuId !== seiyuuId) return null

  const updates: any = {}
  if (data.gameTitle) updates.gameTitle = data.gameTitle
  if (data.characterName) updates.characterName = data.characterName
  if (data.roleType) updates.roleType = data.roleType
  if (data.sourceUrl !== undefined) updates.sourceUrl = data.sourceUrl

  if (Object.keys(updates).length > 0) {
    await db.update(gameRole).set(updates).where(eq(gameRole.id, roleId))
  }
  return { updated: true }
}

export async function getGameTitles() {
  const results = await db
    .selectDistinct({ gameTitle: gameRole.gameTitle })
    .from(gameRole)
    .orderBy(gameRole.gameTitle)
  return results.map(r => r.gameTitle)
}

export async function getSeiyuuGameRoles(seiyuuId: string) {
  return db
    .select({
      id: gameRole.id,
      gameTitle: gameRole.gameTitle,
      characterName: gameRole.characterName,
      roleType: gameRole.roleType,
      sourceUrl: gameRole.sourceUrl,
      source: gameRole.source,
    })
    .from(gameRole)
    .where(eq(gameRole.seiyuuId, seiyuuId))
    .orderBy(gameRole.gameTitle)
}
