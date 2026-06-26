import { db } from '../db/client'
import { seiyuu, anime, character, voiceRole } from '../db/schema'
import { fetchVACareerFromAniList } from '../sync/anilist.fetcher'
import { normaliseSeason, normaliseRomajiName, buildAliases } from '../sync/normaliser'
import { eq } from 'drizzle-orm'

export async function enrichSeiyuuCareer(seiyuuId: string) {
  const [s] = await db.select().from(seiyuu).where(eq(seiyuu.id, seiyuuId))
  if (!s) return

  const source = s.source
  if (!source?.startsWith('anilist:')) return

  const anilistId = parseInt(source.replace('anilist:', ''), 10)
  if (isNaN(anilistId)) return

  console.log(`🔍 Enriching ${s.nameRomaji} (anilist:${anilistId})...`)

  const edges = await fetchVACareerFromAniList(anilistId)
  console.log(`📦 Fetched ${edges.length} roles from AniList`)

  let synced = 0

  for (const edge of edges) {
    const media = edge.node
    if (!media) continue

    const characters = edge.characters ?? []
    const roleType = (edge.characterRole ?? 'SUPPORTING').toLowerCase()

    // upsert anime
    const studioName = media.studios?.nodes?.[0]?.name ?? null
    const normalisedSeason = normaliseSeason(media.season ?? 'winter')

    const [animeRecord] = await db
      .insert(anime)
      .values({
        titleRomaji: media.title.romaji ?? 'Unknown',
        titleNative: media.title.native ?? null,
        seasonYear: media.seasonYear ?? null,
        seasonQuarter: normalisedSeason,
        studio: studioName,
        status: media.status?.toLowerCase() ?? null,
        coverUrl: media.coverImage?.large ?? null,
        source: `anilist:${media.id}`,
      })
      .onConflictDoUpdate({
        target: anime.source,
        set: {
          titleRomaji: media.title.romaji ?? 'Unknown',
          titleNative: media.title.native ?? null,
          seasonYear: media.seasonYear ?? null,
          seasonQuarter: normalisedSeason,
          studio: studioName,
          status: media.status?.toLowerCase() ?? null,
          coverUrl: media.coverImage?.large ?? null,
          syncedAt: new Date()
        }
      })
      .returning()

    if (!animeRecord) continue

    // process each character
    for (const char of characters) {
      const charSource = `anilist:${media.id}:${char.id}`
      const [charRecord] = await db
        .insert(character)
        .values({
          animeId: animeRecord.id,
          nameRomaji: char.name.full ?? 'Unknown',
          nameKanji: char.name.native ?? null,
          roleType,
          source: charSource,
        })
        .onConflictDoUpdate({
          target: character.source,
          set: {
            nameRomaji: char.name.full ?? 'Unknown',
            nameKanji: char.name.native ?? null,
            roleType,
          }
        })
        .returning()

      if (!charRecord) continue

      // upsert voice role
      const vrSource = `anilist:${media.id}:${char.id}:${anilistId}`
      await db
        .insert(voiceRole)
        .values({
          seiyuuId,
          characterId: charRecord.id,
          animeId: animeRecord.id,
          roleType,
          language: 'Japanese',
          source: vrSource,
        })
        .onConflictDoUpdate({
          target: voiceRole.source,
          set: { roleType }
        })

      synced++
    }

    await Bun.sleep(700)
  }

  // mark as enriched
  await db.update(seiyuu).set({ enriched: true }).where(eq(seiyuu.id, seiyuuId))

  console.log(`✅ Enriched ${s.nameRomaji}: ${synced} roles synced`)
}
