import { db } from '../db/client'
import { anime, voiceRole, character, seiyuu } from '../db/schema'
import { eq } from 'drizzle-orm'
import { enrichAnimeCast } from './anime-enrichment.service'

export async function getAnimeById(id: string) {
  const [animeRow] = await db
    .select()
    .from(anime)
    .where(eq(anime.id, id))

  if (!animeRow) return null

  if (!animeRow.enriched && animeRow.source?.startsWith('anilist:')) {
    enrichAnimeCast(animeRow.id).catch(err =>
      console.error(`Enrichment failed for ${animeRow.titleRomaji}:`, err)
    )
  }

  const cast = await db
    .select({
      roleId: voiceRole.id,
      roleType: voiceRole.roleType,
      language: voiceRole.language,
      character: {
        id: character.id,
        nameRomaji: character.nameRomaji,
        nameKanji: character.nameKanji,
      },
      seiyuu: {
        id: seiyuu.id,
        nameRomaji: seiyuu.nameRomaji,
        nameKanji: seiyuu.nameKanji,
        imageUrl: seiyuu.imageUrl,
      }
    })
    .from(voiceRole)
    .innerJoin(character, eq(voiceRole.characterId, character.id))
    .innerJoin(seiyuu, eq(voiceRole.seiyuuId, seiyuu.id))
    .where(eq(voiceRole.animeId, id))

  return {
    ...animeRow,
    cast
  }
}
