import { db } from '../db/client'
import { seiyuu } from '../db/schema'
import { ilike, or, sql } from 'drizzle-orm'

// basic postgres search — we'll upgrade to MeiliSearch later
export async function searchSeiyuu(query: string, limit = 10) {
  const term = `%${query}%`

  const results = await db
    .select({
      id: seiyuu.id,
      nameRomaji: seiyuu.nameRomaji,
      nameKanji: seiyuu.nameKanji,
      nameAliases: seiyuu.nameAliases,
      agency: seiyuu.agency,
      isActive: seiyuu.isActive,
      isSinger: seiyuu.isSinger,
      imageUrl: seiyuu.imageUrl,
    })
    .from(seiyuu)
    .where(
      or(
        ilike(seiyuu.nameRomaji, term),
        ilike(seiyuu.nameKanji, term),
        sql`${seiyuu.nameAliases}::text ilike ${term}`
      )
    )
    .limit(limit)

  return results
}

// typeahead — faster, fewer fields
export async function suggestSeiyuu(query: string) {
  const term = `%${query}%`

  const results = await db
    .select({
      id: seiyuu.id,
      nameRomaji: seiyuu.nameRomaji,
      nameKanji: seiyuu.nameKanji,
    })
    .from(seiyuu)
    .where(
      or(
        ilike(seiyuu.nameRomaji, term),
        ilike(seiyuu.nameKanji, term)
      )
    )
    .limit(5)

  return results
}
