import { Elysia, t } from 'elysia'
import { syncSeason } from '../../sync/runner'
import { adminMiddleware } from '../../middleware/auth.middleware'

export const syncRoutes = new Elysia({ prefix: '/sync' })
  .use(adminMiddleware)

  .post('/season/:year/:quarter', async ({ params }) => {
    const year = Number(params.year)
    const quarter = params.quarter
    // run in background — don't await
    syncSeason(year, quarter).catch(console.error)
    return { message: `Sync started for ${quarter} ${year}` }
  }, {
    params: t.Object({
      year: t.String(),
      quarter: t.String()
    })
  })
