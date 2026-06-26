import { db } from '../db/client'
import { pairing, pairingAnime, seiyuu, anime, character, voiceRole } from '../db/schema'
import { eq, or, desc, inArray } from 'drizzle-orm'

export async function getAllPairings(page = 1, limit = 24) {
  const offset = (page - 1) * limit

  const results = await db
    .select({
      pairing: {
        id: pairing.id,
        pairName: pairing.pairName,
        description: pairing.description,
        sharedCount: pairing.sharedCount,
        isAutoDetected: pairing.isAutoDetected,
        createdAt: pairing.createdAt,
      },
      seiyuuA: {
        id: seiyuu.id,
        nameRomaji: seiyuu.nameRomaji,
        nameKanji: seiyuu.nameKanji,
        imageUrl: seiyuu.imageUrl,
      }
    })
    .from(pairing)
    .innerJoin(seiyuu, eq(pairing.seiyuuAId, seiyuu.id))
    .orderBy(desc(pairing.sharedCount))
    .limit(limit)
    .offset(offset)

  // fetch seiyuuB separately to avoid self-join alias complexity
  const pairingIds = results.map(r => r.pairing.id)
  const seiyuuBData = pairingIds.length > 0
    ? await db
        .select({
          pairingId: pairing.id,
          seiyuuB: {
            id: seiyuu.id,
            nameRomaji: seiyuu.nameRomaji,
            nameKanji: seiyuu.nameKanji,
            imageUrl: seiyuu.imageUrl,
          }
        })
        .from(pairing)
        .innerJoin(seiyuu, eq(pairing.seiyuuBId, seiyuu.id))
        .where(or(...pairingIds.map(id => eq(pairing.id, id))))
    : []

  const seiyuuBMap = new Map(seiyuuBData.map(r => [r.pairingId, r.seiyuuB]))

  return results.map(r => ({
    ...r,
    seiyuuB: seiyuuBMap.get(r.pairing.id) ?? null
  }))
}

export async function getPairingById(id: string) {
  const [result] = await db
    .select()
    .from(pairing)
    .where(eq(pairing.id, id))

  if (!result) return null

  // get both seiyuus
  const [seiyuuA] = await db
    .select()
    .from(seiyuu)
    .where(eq(seiyuu.id, result.seiyuuAId))

  const [seiyuuB] = await db
    .select()
    .from(seiyuu)
    .where(eq(seiyuu.id, result.seiyuuBId))

  // get shared anime
  const sharedAnime = await db
    .select({
      anime: {
        id: anime.id,
        titleRomaji: anime.titleRomaji,
        titleNative: anime.titleNative,
        seasonYear: anime.seasonYear,
        studio: anime.studio,
        coverUrl: anime.coverUrl,
      },
      charA: {
        id: character.id,
        nameRomaji: character.nameRomaji,
      },
    })
    .from(pairingAnime)
    .innerJoin(anime, eq(pairingAnime.animeId, anime.id))
    .leftJoin(character, eq(pairingAnime.charAId, character.id))
    .where(eq(pairingAnime.pairingId, id))

  const pairingAnimeRows = await db
    .select({
      animeId: pairingAnime.animeId,
      charBId: pairingAnime.charBId,
    })
    .from(pairingAnime)
    .where(eq(pairingAnime.pairingId, id))

  // batch-load all charB in one query
  const charBIds = pairingAnimeRows.map(r => r.charBId).filter(Boolean) as string[]
  const charBMap = new Map<string, { id: string; nameRomaji: string }>()
  if (charBIds.length > 0) {
    const charBs = await db
      .select({ id: character.id, nameRomaji: character.nameRomaji })
      .from(character)
      .where(inArray(character.id, charBIds))
    for (const c of charBs) charBMap.set(c.id, c)
  }

  const enrichedSharedAnime = sharedAnime.map(sa => {
    const paData = pairingAnimeRows.find(r => r.animeId === sa.anime.id)
    return { ...sa, charB: paData?.charBId ? charBMap.get(paData.charBId) ?? null : null }
  })

  return {
    ...result,
    seiyuuA,
    seiyuuB,
    sharedAnime: enrichedSharedAnime
  }
}

export async function getSeiyuuPairings(seiyuuId: string) {
  const results = await db
    .select()
    .from(pairing)
    .where(
      or(
        eq(pairing.seiyuuAId, seiyuuId),
        eq(pairing.seiyuuBId, seiyuuId)
      )
    )
    .orderBy(desc(pairing.sharedCount))

  return results
}

export async function createPairing(data: {
  seiyuuAId: string
  seiyuuBId: string
  pairName?: string
  description?: string
}) {
  // Option A: Use a tuple assertion so TS knows exactly 2 strings are returned
  const [a, b] = [data.seiyuuAId, data.seiyuuBId].sort() as [string, string]

  const [result] = await db
    .insert(pairing)
    .values({ // <--- Back to a single object, no array brackets!
      seiyuuAId: a,
      seiyuuBId: b,
      pairName: data.pairName,
      description: data.description,
      isAutoDetected: false,
    })
    .returning()

  return result
}

export async function updatePairing(id: string, data: {
  pairName?: string
  description?: string
}) {
  const [result] = await db
    .update(pairing)
    .set(data)
    .where(eq(pairing.id, id))
    .returning()

  return result
}

export async function deletePairing(id: string) {
  const [result] = await db
    .delete(pairing)
    .where(eq(pairing.id, id))
    .returning()

  return result ?? null
}

export async function detectSharedAnime(pairingId: string) {
  const [p] = await db.select().from(pairing).where(eq(pairing.id, pairingId))
  if (!p) return null

  const saId = p.seiyuuAId
  const sbId = p.seiyuuBId

  // find anime where seiyuu A has roles
  const aAnime = await db
    .select({ animeId: voiceRole.animeId, characterId: voiceRole.characterId })
    .from(voiceRole)
    .where(eq(voiceRole.seiyuuId, saId))

  const aIds = new Map(aAnime.map(r => [r.animeId, r.characterId]))

  // find anime where seiyuu B also has roles
  const bRoles = await db
    .select({ animeId: voiceRole.animeId, characterId: voiceRole.characterId })
    .from(voiceRole)
    .where(eq(voiceRole.seiyuuId, sbId))

  // intersect — shared anime
  const shared = bRoles.filter(r => aIds.has(r.animeId))

  // insert pairingAnime rows
  for (const s of shared) {
    const charAId = aIds.get(s.animeId)!
    const charBId = s.characterId
    await db
      .insert(pairingAnime)
      .values({
        pairingId,
        animeId: s.animeId,
        charAId,
        charBId,
      })
      .onConflictDoNothing()
  }

  // update shared count
  await db
    .update(pairing)
    .set({ sharedCount: shared.length, isAutoDetected: true })
    .where(eq(pairing.id, pairingId))

  return shared.length
}
