import { Elysia, t } from 'elysia'
import { getNews, createNewsPost, deleteNewsPost } from '../../services/news.service'
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

const adminNewsRoutes = new Elysia({ prefix: '/news' })
  .use(adminMiddleware)
  .post('/', async ({ body, set }) => {
    const result = await createNewsPost(body)
    set.status = 201
    return result
  }, {
    body: t.Object({
      title: t.String(),
      body: t.String(),
      category: t.Optional(t.String()),
      seiyuuId: t.Optional(t.String()),
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

export const newsRoutes = new Elysia()
  .use(publicNewsRoutes)
  .use(adminNewsRoutes)
