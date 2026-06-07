import { meili } from '../lib/meili'

export async function indexSeiyuuToMeili(seiyuuList: {
  id: string
  nameRomaji: string
  nameKanji: string | null
  nameAliases: string[] | null
  agency: string | null
  isActive: boolean | null
  isSinger: boolean | null
  imageUrl: string | null
}[]) {
  const index = meili.index('seiyuu')

  // MeiliSearch accepts batches
  const documents = seiyuuList.map(s => ({
    id: s.id,
    nameRomaji: s.nameRomaji,
    nameKanji: s.nameKanji ?? '',
    nameAliases: s.nameAliases ?? [],
    agency: s.agency ?? '',
    isActive: s.isActive ?? true,
    isSinger: s.isSinger ?? false,
    imageUrl: s.imageUrl ?? ''
  }))

  await index.addDocuments(documents)
  console.log(`✅ Indexed ${documents.length} seiyuu to MeiliSearch`)
}
