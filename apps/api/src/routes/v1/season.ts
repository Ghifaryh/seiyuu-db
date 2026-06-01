import { Elysia, t } from 'elysia'
import {
  getSeasonAnime,
  getSeasonAnimeCast,
  getSeasonSeiyuu,
  getCurrentSeason
} from '../../services/season.service'

export const seasonRoutes = new Elysia({ prefix: '/season' })

  // GET /api/v1/season/current
  .get('/current', async () => {
    const { year, quarter } = getCurrentSeason()
    const data = await getSeasonAnimeCast(year, quarter)
    return { year, quarter, data }
  })

  // GET /api/v1/season/:year/:quarter
  .get('/:year/:quarter', async ({ params }) => {
    const year = Number(params.year)
    const quarter = params.quarter
    const data = await getSeasonAnimeCast(year, quarter)
    return { year, quarter, data }
  }, {
    params: t.Object({
      year: t.String(),
      quarter: t.String()
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
