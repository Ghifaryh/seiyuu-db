import { Elysia, t } from 'elysia'
import { getAllSeiyuu, getSeiyuuById, getSeiyuuRoles, getSeiyuuGameRoles, updateSeiyuu, addAnimeRole, addGameRole, deleteAnimeRole, deleteGameRole, updateAnimeRole, updateGameRole, getGameTitles } from '../../services/seiyuu.service'
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

  // GET /api/v1/game-titles
  .get('/game-titles', async () => {
    return await getGameTitles()
  })

  .get('/:id/game-roles', async ({ params }) => {
    return await getSeiyuuGameRoles(params.id)
  }, {
    params: t.Object({ id: t.String() })
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
  .post('/:id/anime-roles', async ({ params, body, set }) => {
    try {
      const result = await addAnimeRole(params.id, body)
      set.status = 201
      return result
    } catch (e: any) {
      console.error('addAnimeRole error:', e.message || e)
      set.status = 400
      return { message: 'Failed to add anime role', error: e.message || String(e) }
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      animeId: t.String(),
      characterName: t.String(),
      roleType: t.Optional(t.String()),
    })
  })
  .post('/:id/game-roles', async ({ params, body, set }) => {
    const result = await addGameRole(params.id, body)
    set.status = 201
    return result
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      gameTitle: t.String(),
      characterName: t.String(),
      roleType: t.Optional(t.String()),
      sourceUrl: t.Optional(t.String()),
    })
  })
  .delete('/:id/anime-roles/:roleId', async ({ params, set }) => {
    const result = await deleteAnimeRole(params.roleId, params.id)
    if (!result) { set.status = 404; return { message: 'Not found or not deletable' } }
    return result
  }, {
    params: t.Object({ id: t.String(), roleId: t.String() })
  })
  .patch('/:id/anime-roles/:roleId', async ({ params, body, set }) => {
    const result = await updateAnimeRole(params.roleId, params.id, body)
    if (!result) { set.status = 404; return { message: 'Not found' } }
    return result
  }, {
    params: t.Object({ id: t.String(), roleId: t.String() }),
    body: t.Object({
      characterName: t.Optional(t.String()),
      roleType: t.Optional(t.String()),
    })
  })
  .delete('/:id/game-roles/:roleId', async ({ params, set }) => {
    const result = await deleteGameRole(params.roleId, params.id)
    if (!result) { set.status = 404; return { message: 'Not found or not deletable' } }
    return result
  }, {
    params: t.Object({ id: t.String(), roleId: t.String() })
  })
  .patch('/:id/game-roles/:roleId', async ({ params, body, set }) => {
    const result = await updateGameRole(params.roleId, params.id, body)
    if (!result) { set.status = 404; return { message: 'Not found' } }
    return result
  }, {
    params: t.Object({ id: t.String(), roleId: t.String() }),
    body: t.Object({
      gameTitle: t.Optional(t.String()),
      characterName: t.Optional(t.String()),
      roleType: t.Optional(t.String()),
      sourceUrl: t.Optional(t.Nullable(t.String())),
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
