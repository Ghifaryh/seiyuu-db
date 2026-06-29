import { db } from '../db/client'
import { seiyuu, anime, character, voiceRole } from '../db/schema'
import { fetchAnimeCastFromAniList } from '../sync/anilist.fetcher'
import { eq } from 'drizzle-orm'

export async function enrichAnimeCast(animeId: string) {
  const [a] = await db.select().from(anime).where(eq(anime.id, animeId))
  if (!a) return

  const source = a.source
  if (!source?.startsWith('anilist:')) return

  const anilistId = parseInt(source.replace('anilist:', ''), 10)
  if (isNaN(anilistId)) return

  console.log(`🔍 Enriching anime ${a.titleRomaji} (anilist:${anilistId})...`)

  const edges = await fetchAnimeCastFromAniList(anilistId)
  console.log(`📦 Fetched ${edges.length} characters from AniList`)

  let synced = 0

  for (const edge of edges) {
    const charNode = edge.node
    if (!charNode) continue

    const roleType = (edge.role ?? 'SUPPORTING').toLowerCase()
    const vaList = edge.voiceActors ?? []

    // upsert character
    const charSource = `anilist:${anilistId}:${charNode.id}`
    const [charRecord] = await db
      .insert(character)
      .values({
        animeId,
        nameRomaji: charNode.name.full ?? 'Unknown',
        nameKanji: charNode.name.native ?? null,
        roleType,
        source: charSource,
      })
      .onConflictDoUpdate({
        target: character.source,
        set: {
          nameRomaji: charNode.name.full ?? 'Unknown',
          nameKanji: charNode.name.native ?? null,
          roleType,
        }
      })
      .returning()

    if (!charRecord) continue

    // upsert each voice actor for this character
    for (const va of vaList) {
      const vaSource = `anilist:${va.id}`

      const birthdate = va.dateOfBirth
        ? [
            va.dateOfBirth.year?.toString() ?? null,
            va.dateOfBirth.month?.toString().padStart(2, '0') ?? null,
            va.dateOfBirth.day?.toString().padStart(2, '0') ?? null,
          ].filter(Boolean).join('-') || null
        : null

      const [vaRecord] = await db
        .insert(seiyuu)
        .values({
          nameRomaji: va.name.full ?? 'Unknown',
          nameKanji: va.name.native ?? null,
          imageUrl: va.image?.large ?? null,
          birthdate: birthdate ?? undefined,
          birthplace: va.homeTown ?? undefined,
          source: vaSource,
        })
        .onConflictDoUpdate({
          target: seiyuu.source,
          set: {
            nameRomaji: va.name.full ?? 'Unknown',
            nameKanji: va.name.native ?? null,
            imageUrl: va.image?.large ?? null,
            birthdate: birthdate ?? undefined,
            birthplace: va.homeTown ?? undefined,
            syncedAt: new Date(),
          }
        })
        .returning()

      if (!vaRecord) continue

      // upsert voice role
      const vrSource = `anilist:${anilistId}:${charNode.id}:${va.id}`
      await db
        .insert(voiceRole)
        .values({
          seiyuuId: vaRecord.id,
          characterId: charRecord.id,
          animeId,
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
  }

  // mark as enriched
  await db.update(anime).set({ enriched: true }).where(eq(anime.id, animeId))

  console.log(`✅ Enriched ${a.titleRomaji}: ${synced} voice roles synced`)
}
