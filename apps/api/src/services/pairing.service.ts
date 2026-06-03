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

  return results
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

  return {
    ...result,
    seiyuuA,
    seiyuuB,
    sharedAnime
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
