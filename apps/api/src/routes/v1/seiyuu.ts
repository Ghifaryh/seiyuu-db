import { Elysia, t } from 'elysia'
import { getAllSeiyuu, getSeiyuuById, getSeiyuuRoles, updateSeiyuu } from '../../services/seiyuu.service'
import { adminMiddleware } from '../../middleware/auth.middleware'

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

export const adminSeiyuuRoutes = new Elysia({ prefix: '/seiyuu' })
  .use(adminMiddleware)
  .patch('/:id', async ({ params, body, set }) => {
    const result = await updateSeiyuu(params.id, body)
    if (!result) {
      set.status = 404
      return { message: 'Seiyuu not found' }
    }
    return result
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      agency: t.Optional(t.Nullable(t.String())),
      isActive: t.Optional(t.Boolean()),
      isSinger: t.Optional(t.Boolean()),
      biography: t.Optional(t.Nullable(t.String())),
      musicSingles: t.Optional(t.Nullable(t.Array(t.String()))),
      musicAlbums: t.Optional(t.Nullable(t.Array(t.String()))),
      adminNotes: t.Optional(t.Nullable(t.String())),
    })
  })
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
