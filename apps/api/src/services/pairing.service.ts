import { db } from '../db/client'
import { pairing, pairingAnime, seiyuu, anime, character } from '../db/schema'
import { eq, or, desc } from 'drizzle-orm'

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

  const charBMap = new Map<string, { id: string; nameRomaji: string }>()
  
  for (const pa of pairingAnimeRows) {
    if (pa.charBId && !charBMap.has(pa.charBId)) {
      const [charB] = await db
        .select({ id: character.id, nameRomaji: character.nameRomaji })
        .from(character)
        .where(eq(character.id, pa.charBId))
      if (charB) charBMap.set(pa.charBId, charB)
    }
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
