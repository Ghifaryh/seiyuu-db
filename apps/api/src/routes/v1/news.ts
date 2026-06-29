import { Elysia, t } from 'elysia'
import { getNews, getNewsById, createNewsPost, deleteNewsPost, updateNewsPost } from '../../services/news.service'
import { adminMiddleware } from '../../middleware/auth.middleware'

const publicNewsRoutes = new Elysia({ prefix: '/news' })
  .get('/', async ({ query }) => {
    const limit = Number(query.limit ?? 20)
    return await getNews(query.category, limit)
  }, {
    query: t.Object({
      category: t.Optional(t.String()),
      limit: t.Optional(t.String())
    })
  })
  .get('/:id', async ({ params, set }) => {
    const result = await getNewsById(params.id)
    if (!result) {
      set.status = 404
      return { message: 'News post not found' }
    }
    return result
  }, {
    params: t.Object({ id: t.String() })
  })

const adminNewsRoutes = new Elysia({ prefix: '/news' })
  .use(adminMiddleware)
  .post('/', async ({ body, set }) => {
    const result = await createNewsPost(body)
    set.status = 201
    return result
  }, {
    body: t.Object({
      title: t.String(),
      body: t.Optional(t.String()),
      category: t.Optional(t.String()),
      seiyuuIds: t.Optional(t.Array(t.String())),
      sourceUrl: t.Optional(t.String()),
      createdBy: t.String()
    })
  })
  .delete('/:id', async ({ params, set }) => {
    const result = await deleteNewsPost(params.id)
    if (!result) {
      set.status = 404
      return { message: 'News post not found' }
    }
    return { message: 'Deleted successfully' }
  }, {
    params: t.Object({ id: t.String() })
  })
  .patch('/:id', async ({ params, body, set }) => {
    const result = await updateNewsPost(params.id, body)
    if (!result) {
      set.status = 404
      return { message: 'News post not found' }
    }
    return result
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      title: t.Optional(t.String()),
      body: t.Optional(t.String()),
      category: t.Optional(t.String()),
      seiyuuIds: t.Optional(t.Nullable(t.Array(t.String()))),
      sourceUrl: t.Optional(t.Nullable(t.String())),
    })
  })

export const newsRoutes = new Elysia()
  .use(publicNewsRoutes)
  .use(adminNewsRoutes)
