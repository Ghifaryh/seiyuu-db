import { Elysia, t } from 'elysia'
import {
  getSeasonAnime,
  getSeasonAnimeCast,
  getSeasonSeiyuu,
  getCurrentSeason
} from '../../services/season.service'

export const seasonRoutes = new Elysia({ prefix: '/season' })

  // GET /api/v1/season/current
  .get('/current', async ({ query }) => {
    const { year, quarter } = getCurrentSeason()
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 12)
    const result = await getSeasonAnimeCast(year, quarter, page, limit)
    return { year, quarter, ...result }
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
    })
  })

  // GET /api/v1/season/current/seiyuu
  .get('/current/seiyuu', async () => {
    const { year, quarter } = getCurrentSeason()
    const data = await getSeasonSeiyuu(year, quarter)
    return { year, quarter, data }
  })

  // GET /api/v1/season/:year/:quarter
  .get('/:year/:quarter', async ({ params, query }) => {
    const year = Number(params.year)
    const quarter = params.quarter
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 12)
    const result = await getSeasonAnimeCast(year, quarter, page, limit)
    return { year, quarter, ...result }
  }, {
    params: t.Object({
      year: t.String(),
      quarter: t.String()
    }),
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
    })
  })

  // GET /api/v1/season/:year/:quarter/seiyuu
  .get('/:year/:quarter/seiyuu', async ({ params }) => {
    const year = Number(params.year)
    const quarter = params.quarter
    const data = await getSeasonSeiyuu(year, quarter)
    return { year, quarter, data }
  }, {
    params: t.Object({
      year: t.String(),
      quarter: t.String()
    })
  })
