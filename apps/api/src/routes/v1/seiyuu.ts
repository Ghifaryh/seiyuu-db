import { Elysia, t } from 'elysia'
import { getAllSeiyuu, getSeiyuuById, getSeiyuuRoles } from '../../services/seiyuu.service'

export const seiyuuRoutes = new Elysia({ prefix: '/seiyuu' })

  // GET /api/seiyuu
  .get('/', async ({ query }) => {
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 24)
    return await getAllSeiyuu(page, limit)
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String())
    })
  })

  // GET /api/seiyuu/:id
  .get('/:id', async ({ params, set }) => {
    const result = await getSeiyuuById(params.id)
    if (!result) {
      set.status = 404
      return { message: 'Seiyuu not found' }
    }
    return result
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  // GET /api/seiyuu/:id/roles
  .get('/:id/roles', async ({ params, query }) => {
    return await getSeiyuuRoles(
      params.id,
      query.year ? Number(query.year) : undefined,
      query.quarter,
      query.type
    )
  }, {
    params: t.Object({
      id: t.String()
    }),
    query: t.Object({
      year: t.Optional(t.String()),
      quarter: t.Optional(t.String()),
      type: t.Optional(t.String())
    })
  })
