const ANILIST_URL = 'https://graphql.anilist.co'

// fetch all staff (seiyuu) for a season
export async function fetchSeasonFromAniList(year: number, season: string) {
  const query = `
    query ($year: Int, $season: MediaSeason, $page: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(seasonYear: $year, season: $season, type: ANIME, format_in: [TV, TV_SHORT, MOVIE, OVA, ONA]) {
          id
          title {
            romaji
            native
          }
          studios(isMain: true) {
            nodes { name }
          }
          status
          coverImage {
            large
          }
          characters(role: MAIN, page: 1, perPage: 25) {
            edges {
              role
              node {
                id
                name {
                  full
                  native
                }
              }
              voiceActors(language: JAPANESE) {
                id
                name {
                  full
                  native
                  alternative
                }
                dateOfBirth {
                  year
                  month
                  day
                }
                homeTown
                image {
                  large
                }
                isFavourite
              }
            }
          }
        }
      }
    }
  `

  const allMedia = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: {
          year,
          season: season.toUpperCase(),
          page
        }
      })
    })

    if (!res.ok) {
      console.error(`AniList API error: ${res.status}`)
      break
    }

    const json = await res.json() as any
    const pageData = json.data?.Page

    if (!pageData) break

    allMedia.push(...pageData.media)
    hasNextPage = pageData.pageInfo.hasNextPage
    page++

    // be respectful — AniList rate limits at 90 req/min
    await Bun.sleep(700)
  }

  return allMedia
}

// fetch a single staff member's full profile
export async function fetchStaffFromAniList(anilistId: number) {
  const query = `
    query ($id: Int) {
      Staff(id: $id) {
        id
        name {
          full
          native
          alternative
        }
        dateOfBirth {
          year month day
        }
        homeTown
        image { large }
        description
        staffMedia(type: ANIME, sort: START_DATE_DESC, page: 1, perPage: 50) {
          edges {
            staffRole
            node {
              id
              title { romaji native }
              seasonYear
              season
              studios(isMain: true) { nodes { name } }
              status
              coverImage { large }
              characters {
                nodes {
                  id
                  name { full native }
                }
              }
            }
          }
        }
      }
    }
  `

  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id: anilistId } })
  })

  const json = await res.json() as any
  return json.data?.Staff ?? null
}

// fetch full voice acting career (characterMedia) for a seiyuu
export async function fetchVACareerFromAniList(anilistId: number) {
  const query = `
    query ($id: Int, $page: Int) {
      Staff(id: $id) {
        id
        characterMedia(sort: START_DATE_DESC, page: $page, perPage: 50) {
          pageInfo {
            hasNextPage
            currentPage
          }
          edges {
            characterRole
            characters {
              id
              name { full native }
            }
            node {
              id
              title { romaji native }
              seasonYear
              season
              studios(isMain: true) { nodes { name } }
              status
              coverImage { large }
            }
          }
        }
      }
    }
  `

  const allEdges: any[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: anilistId, page } })
    })

    if (!res.ok) break

    const json = await res.json() as any
    const pageData = json.data?.Staff?.characterMedia

    if (!pageData) break

    allEdges.push(...pageData.edges)
    hasNextPage = pageData.pageInfo.hasNextPage
    page++

    await Bun.sleep(700)
  }

  return allEdges
}

// fetch full voice cast of an anime from AniList
export async function fetchAnimeCastFromAniList(anilistId: number) {
  const query = `
    query ($id: Int, $page: Int) {
      Media(id: $id) {
        id
        title { romaji native }
        characters(sort: ROLE, page: $page, perPage: 50) {
          pageInfo { hasNextPage currentPage }
          edges {
            role
            node { id name { full native } }
            voiceActors(language: JAPANESE) {
              id
              name { full native }
              image { large }
              dateOfBirth { year month day }
              homeTown
            }
          }
        }
      }
    }
  `

  const allEdges: any[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: anilistId, page } })
    })

    if (!res.ok) break

    const json = await res.json() as any
    const pageData = json.data?.Media?.characters

    if (!pageData) break

    allEdges.push(...pageData.edges)
    hasNextPage = pageData.pageInfo.hasNextPage
    page++

    await Bun.sleep(700)
  }

  return allEdges
}
