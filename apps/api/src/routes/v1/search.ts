import { Elysia, t } from 'elysia'
import { searchSeiyuu, suggestSeiyuu } from '../../services/search.service'

export const searchRoutes = new Elysia({ prefix: '/search' })

  // GET /api/v1/search?q=kayano
  .get('/', async ({ query, set }) => {
    if (!query.q || query.q.trim() === '') {
      set.status = 400
      return { message: 'Query parameter q is required' }
    }
    const limit = Number(query.limit ?? 10)
    const results = await searchSeiyuu(query.q, limit)
    return { query: query.q, results }
  }, {
    query: t.Object({
      q: t.Optional(t.String()),
      limit: t.Optional(t.String())
    })
  })

  // GET /api/v1/search/suggest?q=kaya
  .get('/suggest', async ({ query, set }) => {
    if (!query.q || query.q.trim() === '') {
      set.status = 400
      return { message: 'Query parameter q is required' }
    }
    const results = await suggestSeiyuu(query.q)
    return { query: query.q, results }
  }, {
    query: t.Object({
      q: t.Optional(t.String())
    })
  })
