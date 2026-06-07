import { db } from '../db/client'
import { anime, character, seiyuu, voiceRole } from '../db/schema'
import { fetchSeasonFromAniList } from './anilist.fetcher'
import { normaliseSeason, normaliseRomajiName, buildAliases, formatBirthdate } from './normaliser'
import { indexSeiyuuToMeili } from './meili.indexer'
import { eq, and } from 'drizzle-orm'

export async function syncSeason(year: number, quarter: string) {
  console.log(`🔄 Syncing ${quarter} ${year} from AniList...`)

  const rawMedia = await fetchSeasonFromAniList(year, quarter)
  console.log(`📦 Fetched ${rawMedia.length} anime from AniList`)

  const seiyuuMap = new Map<number, string>() // anilistId → our db uuid

  for (const media of rawMedia) {
    // 1. upsert anime
    const studioName = media.studios?.nodes?.[0]?.name ?? null
    const normalisedSeason = normaliseSeason(media.season ?? quarter)

    const [animeRecord] = await db
      .insert(anime)
      .values({
        titleRomaji: media.title.romaji,
        titleNative: media.title.native,
        seasonYear: year,
        seasonQuarter: normalisedSeason,
        studio: studioName,
        status: media.status?.toLowerCase() ?? null,
        coverUrl: media.coverImage?.large ?? null,
        source: `anilist:${media.id}`,
      })
      .onConflictDoUpdate({
        target: anime.source,
        set: {
          titleRomaji: media.title.romaji,
          titleNative: media.title.native,
          studio: studioName,
          status: media.status?.toLowerCase() ?? null,
          coverUrl: media.coverImage?.large ?? null,
          syncedAt: new Date()
        }
      })
      .returning()

    if (!animeRecord) {
      console.warn(`⚠️ Skipping anime: ${media.title.romaji}`)
      continue
    }

    // 2. process each character + voice actor
    for (const edge of media.characters?.edges ?? []) {
      const charData = edge.node
      const roleType = edge.role?.toLowerCase() ?? 'supporting'

      // upsert character
      const [charRecord] = await db
        .insert(character)
        .values({
          animeId: animeRecord.id,
          nameRomaji: charData.name.full ?? 'Unknown',
          nameKanji: charData.name.native ?? null,
          roleType
        })
        .onConflictDoNothing()
        .returning()

      if (!charRecord) continue

      // 3. process voice actors
      for (const va of edge.voiceActors ?? []) {
        let seiyuuId: string

        // check if we already processed this VA in this sync
        if (seiyuuMap.has(va.id)) {
          seiyuuId = seiyuuMap.get(va.id)!
        } else {
          const nameRomaji = normaliseRomajiName(va.name.full ?? '')
          const aliases = buildAliases(va.name)
          const birthdate = formatBirthdate(va.dateOfBirth)

          // upsert seiyuu
          // after the seiyuu upsert (line 102 area)
          const [seiyuuRecord] = await db
            .insert(seiyuu)
            .values({
              nameRomaji,
              nameKanji: va.name.native ?? null,
              nameAliases: aliases,
              birthdate,
              birthplace: va.homeTown ?? null,
              imageUrl: va.image?.large ?? null,
              source: `anilist:${va.id}`,
              syncedAt: new Date()
            })
            .onConflictDoUpdate({
              target: seiyuu.source,
              set: {
                nameRomaji,
                nameKanji: va.name.native ?? null,
                nameAliases: aliases,
                imageUrl: va.image?.large ?? null,
                syncedAt: new Date()
              }
            })
            .returning()

          if (!seiyuuRecord) {
            console.warn(`⚠️ Skipping seiyuu: ${nameRomaji}`)
            continue
          }

          seiyuuId = seiyuuRecord.id
          seiyuuMap.set(va.id, seiyuuId)
        }

        // 4. upsert voice role
        await db
          .insert(voiceRole)
          .values({
            seiyuuId,
            characterId: charRecord.id,
            animeId: animeRecord.id,
            roleType,
            language: 'Japanese'
          })
          .onConflictDoNothing()
      }
    }

    console.log(`  ✓ ${media.title.romaji}`)
  }

  // 5. index all seiyuu to MeiliSearch
  const allSeiyuu = await db.select().from(seiyuu)
  await indexSeiyuuToMeili(allSeiyuu)

  console.log(`✅ Sync complete — ${seiyuuMap.size} seiyuu processed`)
}
